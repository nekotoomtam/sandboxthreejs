import * as THREE from 'three'
import { worldCatalog } from '../world.registry'

const WORLD_SPACING = 18
const CAMERA_Z = 9.5

export class WorldJourneyRuntime {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120)
  private readonly timer = new THREE.Timer()
  private readonly planets = new THREE.Group()
  private renderer?: THREE.WebGLRenderer
  private container?: HTMLElement
  private resizeObserver?: ResizeObserver
  private animationFrame?: number
  private disposed = false
  private currentCameraX = 0
  private travelFromX = 0
  private travelToX = 0
  private travelElapsed = 0
  private travelDuration = 1.65
  private traveling = false

  mount(container: HTMLElement, initialWorldIndex: number, onReady?: () => void): this {
    this.container = container
    this.currentCameraX = initialWorldIndex * WORLD_SPACING
    this.travelFromX = this.currentCameraX
    this.travelToX = this.currentCameraX

    this.scene.background = new THREE.Color(0x05060b)
    this.scene.fog = new THREE.Fog(0x05060b, 19, 48)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.dataset.worldJourneyCanvas = 'true'
    container.replaceChildren(renderer.domElement)
    this.renderer = renderer

    this.scene.add(new THREE.HemisphereLight(0xbfc8dc, 0x20232b, 1.45))
    const key = new THREE.DirectionalLight(0xe8edf7, 2.2)
    key.position.set(-4, 8, 7)
    this.scene.add(key)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 54),
      new THREE.MeshStandardMaterial({
        color: 0x666a72,
        roughness: 0.88,
        metalness: 0.3,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(WORLD_SPACING, -3.42, -2)
    this.scene.add(floor)

    this.scene.add(this.planets)
    this.loadPlanets(initialWorldIndex, onReady)
    this.applyCamera()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.timer.connect(document)
    this.resize()
    this.tick()
    return this
  }

  travelTo(worldIndex: number, reducedMotion = false): void {
    const nextX = worldIndex * WORLD_SPACING
    if (Math.abs(nextX - this.currentCameraX) < 0.01) return
    this.travelFromX = this.currentCameraX
    this.travelToX = nextX
    this.travelElapsed = 0
    this.travelDuration = reducedMotion ? 0.08 : 1.65
    this.traveling = true
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame)
    this.resizeObserver?.disconnect()
    this.timer.dispose()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
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

  private loadPlanets(initialWorldIndex: number, onReady?: () => void): void {
    const loader = new THREE.TextureLoader()
    let readyReported = false
    const reportReady = () => {
      if (readyReported) return
      readyReported = true
      this.renderer?.render(this.scene, this.camera)
      onReady?.()
    }

    worldCatalog.forEach((world, index) => {
      loader.load(
        world.imageSrc,
        (texture) => {
          if (this.disposed) {
            texture.dispose()
            return
          }
          texture.colorSpace = THREE.SRGBColorSpace
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
          const planet = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 11.8), material)
          planet.position.set(index * WORLD_SPACING + 6.55, 1.1, 0)
          planet.renderOrder = 1
          this.planets.add(planet)
          if (index === initialWorldIndex) reportReady()
        },
        undefined,
        () => {
          if (index === initialWorldIndex) reportReady()
        },
      )
    })
  }

  private resize(): void {
    if (!this.container || !this.renderer) return
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private applyCamera(travelLift = 0): void {
    this.camera.position.set(this.currentCameraX, 1.65 + travelLift * 0.16, CAMERA_Z + travelLift)
    this.camera.lookAt(this.currentCameraX + 0.75, 0.85, 0)
    this.camera.updateMatrixWorld()
  }

  private tick = (timestamp?: DOMHighResTimeStamp) => {
    if (this.disposed) return
    this.timer.update(timestamp)
    const delta = this.timer.getDelta()

    if (this.traveling) {
      this.travelElapsed += delta
      const raw = Math.min(this.travelElapsed / this.travelDuration, 1)
      const eased = raw * raw * (3 - 2 * raw)
      this.currentCameraX = THREE.MathUtils.lerp(this.travelFromX, this.travelToX, eased)
      this.applyCamera(Math.sin(raw * Math.PI) * 2.25)
      if (raw >= 1) this.traveling = false
    }

    for (const planet of this.planets.children) {
      planet.rotation.z += delta * 0.018
    }

    this.renderer?.render(this.scene, this.camera)
    this.animationFrame = requestAnimationFrame(this.tick)
  }
}
