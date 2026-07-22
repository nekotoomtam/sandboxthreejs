import * as THREE from 'three'
import { createVrmLoader, loadMonaAsset } from './monaLoader'
import { MonaController } from './MonaController'
import { selectExperienceQuality, shouldShowStartMarker } from './experienceRuntime.helpers'

export class ExperienceRuntime {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  private readonly clock = new THREE.Clock()
  private renderer?: THREE.WebGLRenderer
  private container?: HTMLElement
  private resizeObserver?: ResizeObserver
  private animationFrame?: number
  private mona?: MonaController
  private startMarker?: THREE.Group
  private ready = false
  private entered = false
  private disposed = false
  private hidden = document.hidden

  mount(container: HTMLElement): this {
    if (this.disposed) throw new Error('ExperienceRuntime is disposed.')
    this.container = container
    this.scene.background = new THREE.Color(0x123d34)
    this.scene.fog = new THREE.Fog(0x123d34, 8, 24)
    this.camera.position.set(0.3, 1.45, 6.4)
    this.camera.lookAt(1.3, 1.05, -3.4)

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

    this.scene.add(new THREE.HemisphereLight(0xeaf7f1, 0x173f37, 2.2))
    const key = new THREE.DirectionalLight(0xffe2a7, 3.1)
    key.position.set(-3, 6, 4)
    this.scene.add(key)
    const floor = new THREE.GridHelper(30, 30, 0x9ec8ba, 0x5f8c7e)
    this.scene.add(floor)

    const marker = new THREE.Group()
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3a83b,
      emissive: 0xc36d13,
      emissiveIntensity: 0.8,
      roughness: 0.35,
    })
    marker.add(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.08, 20, 72), markerMaterial))
    marker.position.set(-1.65, 1.05, 0.3)
    marker.rotation.x = -0.1
    marker.visible = false
    this.scene.add(marker)
    this.startMarker = marker

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.resize()
    this.tick()
    return this
  }

  async load(url: string, onProgress: (progress: number) => void): Promise<void> {
    const vrm = await loadMonaAsset(createVrmLoader(), url, onProgress)
    if (this.disposed) return
    this.mona?.dispose()
    this.mona = new MonaController(vrm)
    this.mona.attachTo(this.scene)
    this.ready = true
    this.updateMarkerVisibility()
    onProgress(1)
  }

  setEntered(entered: boolean): void {
    this.entered = entered
    this.updateMarkerVisibility()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame)
    document.removeEventListener('visibilitychange', this.handleVisibility)
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
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private tick = () => {
    if (this.disposed) return
    const delta = this.clock.getDelta()
    if (!this.hidden) {
      this.mona?.update(delta)
      this.renderer?.render(this.scene, this.camera)
    }
    this.animationFrame = requestAnimationFrame(this.tick)
  }

  private handleVisibility = () => {
    this.hidden = document.hidden
    this.clock.getDelta()
  }

  private updateMarkerVisibility(): void {
    if (this.startMarker) {
      this.startMarker.visible = shouldShowStartMarker(this.ready, this.entered)
    }
  }
}
