import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type {
  SandboxObjectDefinition,
  SandboxSceneDefinition,
  SandboxSnapshot,
  TransformPatch,
  Vector3Tuple,
} from '../sandbox.types'
import { calculateCameraOrbit } from '../cameraMath'
import { disposeScene } from './disposeScene'

type SnapshotListener = (snapshot: SandboxSnapshot) => void

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function copyTuple(value: Vector3Tuple | undefined, fallback: Vector3Tuple): Vector3Tuple {
  return value ? [...value] : [...fallback]
}

function createGeometry(definition: SandboxObjectDefinition) {
  const geometry = definition.geometry

  if (geometry.kind === 'sphere') {
    return new THREE.SphereGeometry(geometry.radius, 40, 24)
  }

  return new THREE.BoxGeometry(...geometry.size)
}

export class SandboxRuntime {
  private readonly definition: SandboxSceneDefinition
  private scene?: THREE.Scene
  private camera?: THREE.PerspectiveCamera
  private renderer?: THREE.WebGLRenderer
  private controls?: OrbitControls
  private container?: HTMLElement
  private resizeObserver?: ResizeObserver
  private animationFrame?: number
  private resizeFrame?: number
  private readonly objects = new Map<string, THREE.Mesh>()
  private readonly listeners = new Set<SnapshotListener>()
  private disposed = false

  constructor(definition: SandboxSceneDefinition) {
    this.definition = definition
  }

  create() {
    if (this.scene || this.disposed) {
      return this
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(this.definition.background)

    const camera = new THREE.PerspectiveCamera(
      this.definition.camera.fieldOfView ?? 45,
      1,
      0.1,
      100,
    )
    camera.position.fromArray(this.definition.camera.position)
    camera.lookAt(new THREE.Vector3().fromArray(this.definition.camera.target))

    if (this.definition.helpers?.grid !== false) {
      const grid = new THREE.GridHelper(10, 20, 0x8aa89e, 0xcbd8d3)
      scene.add(grid)
    }

    if (this.definition.helpers?.axes) {
      const axes = new THREE.AxesHelper(2.4)
      axes.position.y = 0.015
      scene.add(axes)
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x47615a, 1.8))

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
    keyLight.position.set(4, 6, 3)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x9cd8ff, 1.1)
    fillLight.position.set(-4, 2, -3)
    scene.add(fillLight)

    for (const objectDefinition of this.definition.objects) {
      const material = new THREE.MeshStandardMaterial({
        color: objectDefinition.material.color,
        roughness: objectDefinition.material.roughness ?? 0.5,
        metalness: objectDefinition.material.metalness ?? 0,
      })
      const mesh = new THREE.Mesh(createGeometry(objectDefinition), material)
      mesh.name = objectDefinition.id
      this.applyInitialTransform(mesh, objectDefinition)
      scene.add(mesh)
      this.objects.set(objectDefinition.id, mesh)
    }

    this.scene = scene
    this.camera = camera
    return this
  }

  mount(container: HTMLElement) {
    if (!this.scene || !this.camera) {
      this.create()
    }
    if (!this.scene || !this.camera || this.disposed) {
      throw new Error('SandboxRuntime could not be created.')
    }

    this.container = container
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.domElement.dataset.sandboxCanvas = 'true'
    container.replaceChildren(renderer.domElement)
    this.renderer = renderer

    const controls = new OrbitControls(this.camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.target.fromArray(this.definition.camera.target)
    controls.minDistance = 2
    controls.maxDistance = 14
    controls.addEventListener('change', this.handleControlsChange)
    this.controls = controls

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeFrame !== undefined) {
        cancelAnimationFrame(this.resizeFrame)
      }
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = undefined
        this.resize()
      })
    })
    this.resizeObserver.observe(container)
    this.resize()
    this.startAnimationLoop()
    this.emitSnapshot()
    return this
  }

  render() {
    if (!this.renderer || !this.scene || !this.camera) {
      return
    }

    this.controls?.update()
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) {
      return
    }

    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.render()
  }

  reset() {
    if (!this.camera || this.disposed) {
      return
    }

    this.camera.position.fromArray(this.definition.camera.position)
    this.controls?.target.fromArray(this.definition.camera.target)

    for (const objectDefinition of this.definition.objects) {
      const object = this.objects.get(objectDefinition.id)
      if (object) {
        this.applyInitialTransform(object, objectDefinition)
      }
    }

    this.controls?.update()
    this.emitSnapshot()
    this.render()
  }

  updateObjectTransform(objectId: string, patch: TransformPatch) {
    const object = this.objects.get(objectId)
    if (!object || this.disposed) {
      return
    }

    for (const [property, axes] of Object.entries(patch)) {
      if (!axes) continue

      for (const [axis, rawValue] of Object.entries(axes)) {
        if (rawValue === undefined || !Number.isFinite(rawValue)) continue
        const value = property === 'rotation' ? rawValue * DEG_TO_RAD : rawValue
        object[property as 'position' | 'rotation' | 'scale'][axis as 'x' | 'y' | 'z'] = value
      }
    }

    this.emitSnapshot()
    this.render()
  }

  applySnapshot(snapshot: SandboxSnapshot) {
    if (!this.camera || this.disposed) {
      return
    }

    for (const [id, transform] of Object.entries(snapshot.objects)) {
      const object = this.objects.get(id)
      if (!object) continue

      object.position.fromArray(transform.position)
      object.rotation.set(
        transform.rotation[0] * DEG_TO_RAD,
        transform.rotation[1] * DEG_TO_RAD,
        transform.rotation[2] * DEG_TO_RAD,
      )
      object.scale.fromArray(transform.scale)
    }

    this.camera.position.fromArray(snapshot.camera.position)
    this.controls?.target.fromArray(snapshot.camera.target)
    this.controls?.update()
    this.emitSnapshot()
    this.render()
  }

  getSnapshot(): SandboxSnapshot {
    const objects: Record<string, SandboxSnapshot['objects'][string]> = {}

    for (const [id, object] of this.objects) {
      objects[id] = {
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [
          object.rotation.x * RAD_TO_DEG,
          object.rotation.y * RAD_TO_DEG,
          object.rotation.z * RAD_TO_DEG,
        ],
        scale: [object.scale.x, object.scale.y, object.scale.z],
      }
    }

    const cameraPosition: Vector3Tuple = this.camera
      ? [this.camera.position.x, this.camera.position.y, this.camera.position.z]
      : [0, 0, 0]
    const cameraTarget: Vector3Tuple = this.controls
      ? [this.controls.target.x, this.controls.target.y, this.controls.target.z]
      : copyTuple(this.definition.camera.target, [0, 0, 0])
    const orbit = calculateCameraOrbit(cameraPosition, cameraTarget)

    return {
      objects,
      camera: {
        position: cameraPosition,
        target: cameraTarget,
        ...orbit,
      },
    }
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame)
    }
    if (this.resizeFrame !== undefined) {
      cancelAnimationFrame(this.resizeFrame)
    }
    this.resizeObserver?.disconnect()
    this.controls?.removeEventListener('change', this.handleControlsChange)
    this.controls?.dispose()

    if (this.scene) {
      disposeScene(this.scene)
    }

    if (this.renderer) {
      const canvas = this.renderer.domElement
      this.renderer.dispose()
      this.renderer.forceContextLoss()
      canvas.remove()
    }

    this.listeners.clear()
    this.objects.clear()
    this.scene = undefined
    this.camera = undefined
    this.renderer = undefined
    this.controls = undefined
    this.container = undefined
  }

  private applyInitialTransform(
    object: THREE.Object3D,
    definition: SandboxObjectDefinition,
  ) {
    object.position.fromArray(copyTuple(definition.position, [0, 0, 0]))
    const rotation = copyTuple(definition.rotation, [0, 0, 0])
    object.rotation.set(
      rotation[0] * DEG_TO_RAD,
      rotation[1] * DEG_TO_RAD,
      rotation[2] * DEG_TO_RAD,
    )
    object.scale.fromArray(copyTuple(definition.scale, [1, 1, 1]))
  }

  private startAnimationLoop() {
    const tick = () => {
      if (this.disposed) return
      this.render()
      this.animationFrame = requestAnimationFrame(tick)
    }

    tick()
  }

  private readonly handleControlsChange = () => {
    this.emitSnapshot()
  }

  private emitSnapshot() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}
