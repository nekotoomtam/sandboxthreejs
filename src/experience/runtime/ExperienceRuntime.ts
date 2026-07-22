import * as THREE from 'three'
import { CameraController } from './CameraController'
import {
  resolveEntryComposition,
  type ExperienceComposition,
} from './experienceComposition'
import {
  ENTRY_DURATION_MS,
  sampleEntryTimeline,
  type EntryTimelineSample,
} from './entryTimeline'
import { createVrmLoader, loadMonaAsset } from './monaLoader'
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

  mount(container: HTMLElement): this {
    if (this.disposed) throw new Error('ExperienceRuntime is disposed.')
    this.container = container
    this.scene.background = new THREE.Color(0x174c42)
    this.scene.fog = new THREE.Fog(0x174c42, 8, 24)

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

    this.scene.add(new THREE.HemisphereLight(0xf4fbf8, 0x315f55, 2.35))
    const key = new THREE.DirectionalLight(0xffe2a7, 3.1)
    key.position.set(-3, 6, 4)
    this.scene.add(key)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0xb7d2c8, roughness: 0.96 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.02
    this.scene.add(floor)
    const grid = new THREE.GridHelper(30, 30, 0xf5e7c8, 0x7fa99d)
    grid.position.y = 0.01
    this.scene.add(grid)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.timer.connect(document)
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.resize()
    this.tick()
    return this
  }

  async load(url: string, onProgress: (progress: number) => void): Promise<void> {
    const vrm = await loadMonaAsset(createVrmLoader(), url, onProgress)
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

  setEntered(entered: boolean): void {
    if (!entered || this.entryActive || this.entryComplete) return
    this.entrySample = sampleEntryTimeline(ENTRY_DURATION_MS, false)
    this.entryComplete = true
    this.cameraController.apply(this.composition, this.entrySample.cameraProgress)
    this.mona?.applyEntrySample(this.entrySample)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame)
    this.onEntryComplete = undefined
    this.entryActive = false
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.timer.dispose()
    this.resizeObserver?.disconnect()
    this.mona?.dispose()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
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
      this.mona?.update(delta)
      this.renderer?.render(this.scene, this.camera)
      if (this.entryActive && this.entrySample.complete) {
        this.entryActive = false
        this.entryComplete = true
        const onComplete = this.onEntryComplete
        this.onEntryComplete = undefined
        onComplete?.()
      }
    }
    this.animationFrame = requestAnimationFrame(this.tick)
  }

  private handleVisibility = () => {
    this.hidden = document.hidden
  }
}
