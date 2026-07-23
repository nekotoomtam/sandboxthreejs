import * as THREE from 'three'
import { CameraController } from './CameraController'
import {
  resolveEntryComposition,
  type ExperienceComposition,
} from './experienceComposition'
import {
  sampleEntryTimeline,
  type EntryTimelineSample,
} from './entryTimeline'
import { createVrmLoader, loadMonaAsset } from './monaLoader'
import { createVrmaLoader, loadVrmaClip } from './vrmaLoader'
import { MonaController } from './MonaController'
import { selectExperienceQuality } from './experienceRuntime.helpers'

export class ExperienceRuntime {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  private readonly cameraController = new CameraController(this.camera)
  private readonly timer = new THREE.Timer()
  private renderer?: THREE.WebGLRenderer
  private container?: HTMLElement
  private resizeObserver?: ResizeObserver
  private animationFrame?: number
  private mona?: MonaController
  private disposed = false
  private hidden = document.hidden
  private composition: ExperienceComposition = resolveEntryComposition(1, 1)
  private entryElapsedMs = 0
  private entryActive = false
  private entryComplete = false
  private entryReducedMotion = false
  private entrySample: EntryTimelineSample = sampleEntryTimeline(0, false)
  private onEntryComplete?: () => void
  private introPlanet?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private worldEntryActive = false
  private worldEntryElapsedMs = 0
  private worldEntryReducedMotion = false
  private onWorldEntryComplete?: () => void

  mount(container: HTMLElement): this {
    if (this.disposed) throw new Error('ExperienceRuntime is disposed.')
    this.container = container
    this.scene.background = new THREE.Color(0x05060b)
    this.scene.fog = new THREE.Fog(0x05060b, 10, 28)

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const quality = selectExperienceQuality({
      width: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      coarsePointer,
    })
    const renderer = new THREE.WebGLRenderer({ antialias: quality.tier === 'desktop' })
    renderer.setPixelRatio(quality.pixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.dataset.experienceCanvas = 'true'
    container.replaceChildren(renderer.domElement)
    this.renderer = renderer

    this.scene.add(new THREE.HemisphereLight(0xe7ebf4, 0x272a31, 1.9))
    const key = new THREE.DirectionalLight(0xf4ddb4, 2.8)
    key.position.set(-3, 6, 4)
    this.scene.add(key)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(42, 42),
      new THREE.MeshStandardMaterial({
        color: 0x686c73,
        roughness: 0.88,
        metalness: 0.32,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.02
    this.scene.add(floor)
    this.loadIntroPlanet()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.timer.connect(document)
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.resize()
    this.tick()
    return this
  }

  async load(
    modelUrl: string,
    idleUrl: string,
    onProgress: (progress: number) => void,
  ): Promise<void> {
    const vrm = await loadMonaAsset(createVrmLoader(), modelUrl, (progress) => {
      onProgress(progress * 0.9)
    })
    const mona = new MonaController(vrm)
    if (this.disposed) {
      mona.dispose()
      return
    }
    this.mona?.dispose()
    this.mona = mona
    this.mona.attachTo(this.scene)
    this.mona.setCompositionPosition(this.composition.monaPosition)
    this.mona.applyEntrySample(this.entrySample)

    try {
      const idleClip = await loadVrmaClip(createVrmaLoader(), idleUrl, vrm, (progress) => {
        onProgress(0.9 + progress * 0.1)
      })
      if (this.disposed) return
      this.mona.setIdleClip(idleClip)
    } catch (error) {
      if (!this.disposed) {
        console.warn('Mona idle animation unavailable; using fallback.', error)
      }
    }

    if (this.disposed) return
    this.mona.update(0)
    this.renderer?.render(this.scene, this.camera)
    onProgress(1)
  }

  playEntry(onComplete: () => void, reducedMotion: boolean): void {
    if (this.disposed || !this.mona || this.entryActive || this.entryComplete) return
    this.entryActive = true
    this.entryReducedMotion = reducedMotion
    this.onEntryComplete = onComplete
  }

  playWorldEntry(onComplete: () => void, reducedMotion: boolean): void {
    if (this.disposed || !this.entryComplete || this.worldEntryActive) return
    this.worldEntryActive = true
    this.worldEntryElapsedMs = 0
    this.worldEntryReducedMotion = reducedMotion
    this.onWorldEntryComplete = onComplete
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame)
    this.onEntryComplete = undefined
    this.onWorldEntryComplete = undefined
    this.entryActive = false
    this.worldEntryActive = false
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.timer.dispose()
    this.resizeObserver?.disconnect()
    this.mona?.dispose()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material instanceof THREE.MeshBasicMaterial) material.map?.dispose()
        material.dispose()
      })
    })
    this.renderer?.dispose()
    this.renderer?.forceContextLoss()
    this.renderer?.domElement.remove()
    this.scene.clear()
  }

  private resize(): void {
    if (!this.container || !this.renderer) return
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.composition = resolveEntryComposition(width, height)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.cameraController.apply(this.composition, this.entrySample.cameraProgress)
    if (this.worldEntryActive) this.applyWorldEntryCamera()
    this.mona?.setCompositionPosition(this.composition.monaPosition)
    this.mona?.applyEntrySample(this.entrySample)
  }

  private tick = (timestamp?: DOMHighResTimeStamp) => {
    if (this.disposed) return
    this.timer.update(timestamp)
    const delta = this.timer.getDelta()
    if (!this.hidden) {
      if (this.entryActive) {
        this.entryElapsedMs += delta * 1_000
        this.entrySample = sampleEntryTimeline(
          this.entryElapsedMs,
          this.entryReducedMotion,
        )
        this.cameraController.apply(this.composition, this.entrySample.cameraProgress)
        this.mona?.applyEntrySample(this.entrySample)
      }
      if (this.worldEntryActive) {
        this.worldEntryElapsedMs += delta * 1_000
        this.applyWorldEntryCamera()
      }
      if (this.introPlanet) this.introPlanet.rotation.z += delta * 0.015
      this.mona?.update(delta)
      this.renderer?.render(this.scene, this.camera)
      if (this.entryActive && this.entrySample.complete) {
        this.entryActive = false
        this.entryComplete = true
        const onComplete = this.onEntryComplete
        this.onEntryComplete = undefined
        onComplete?.()
      }
      if (
        this.worldEntryActive &&
        this.worldEntryElapsedMs >= (this.worldEntryReducedMotion ? 80 : 1_450)
      ) {
        this.worldEntryActive = false
        const onComplete = this.onWorldEntryComplete
        this.onWorldEntryComplete = undefined
        onComplete?.()
      }
    }
    this.animationFrame = requestAnimationFrame(this.tick)
  }

  private handleVisibility = () => {
    this.hidden = document.hidden
  }

  private loadIntroPlanet(): void {
    new THREE.TextureLoader().load(
      '/assets/planets/planet-01-foundations.png',
      (texture) => {
        if (this.disposed) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        const planet = new THREE.Mesh(
          new THREE.PlaneGeometry(5.8, 5.8),
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
        )
        planet.position.set(-1.35, 2.25, -7.2)
        planet.renderOrder = 0
        this.introPlanet = planet
        this.scene.add(planet)
      },
    )
  }

  private applyWorldEntryCamera(): void {
    const duration = this.worldEntryReducedMotion ? 80 : 1_450
    const raw = THREE.MathUtils.clamp(this.worldEntryElapsedMs / duration, 0, 1)
    const progress = raw * raw * (3 - 2 * raw)
    const start = this.composition.entered
    this.camera.position.set(
      THREE.MathUtils.lerp(start.cameraPosition[0], -1.25, progress),
      THREE.MathUtils.lerp(start.cameraPosition[1], 2.05, progress),
      THREE.MathUtils.lerp(start.cameraPosition[2], -4.75, progress),
    )
    this.camera.lookAt(
      THREE.MathUtils.lerp(start.cameraTarget[0], -1.35, progress),
      THREE.MathUtils.lerp(start.cameraTarget[1], 2.25, progress),
      THREE.MathUtils.lerp(start.cameraTarget[2], -7.2, progress),
    )
    this.camera.updateMatrixWorld()
    this.introPlanet?.scale.setScalar(1 + progress * 0.72)
  }
}
