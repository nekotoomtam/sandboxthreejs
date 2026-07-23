import * as THREE from 'three'

const PARTICLE_COUNT = 520
const SWEEP_DISTANCE = 10.5

function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (context) {
    const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    glow.addColorStop(0, 'rgba(255,255,255,0.96)')
    glow.addColorStop(0.28, 'rgba(255,255,255,0.62)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = glow
    context.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(canvas)
}

function createMistTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (context) {
    context.clearRect(0, 0, 256, 256)
    const body = context.createRadialGradient(128, 128, 12, 128, 128, 178)
    body.addColorStop(0, 'rgba(255,255,255,0.72)')
    body.addColorStop(0.58, 'rgba(255,255,255,0.56)')
    body.addColorStop(0.82, 'rgba(255,255,255,0.32)')
    body.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = body
    context.fillRect(0, 0, 256, 256)
    for (let index = 0; index < 42; index += 1) {
      const x = 36 + Math.random() * 184
      const y = 18 + Math.random() * 220
      const radius = 28 + Math.random() * 72
      const mist = context.createRadialGradient(x, y, 0, x, y, radius)
      mist.addColorStop(0, `rgba(255,255,255,${0.1 + Math.random() * 0.14})`)
      mist.addColorStop(0.48, 'rgba(255,255,255,0.075)')
      mist.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = mist
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    context.globalCompositeOperation = 'destination-in'
    const edgeFade = context.createLinearGradient(0, 0, 256, 0)
    edgeFade.addColorStop(0, 'rgba(255,255,255,0)')
    edgeFade.addColorStop(0.16, 'rgba(255,255,255,1)')
    edgeFade.addColorStop(0.84, 'rgba(255,255,255,1)')
    edgeFade.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = edgeFade
    context.fillRect(0, 0, 256, 256)
  }
  return new THREE.CanvasTexture(canvas)
}

export class WorldSweepEffect {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)
  private readonly renderer: THREE.WebGLRenderer
  private readonly group = new THREE.Group()
  private readonly particleTexture = createParticleTexture()
  private readonly mistTexture = createMistTexture()
  private readonly particleGeometry = new THREE.BufferGeometry()
  private readonly particleColors = new Float32Array(PARTICLE_COUNT * 3)
  private readonly particleColorSeeds = new Float32Array(PARTICLE_COUNT)
  private readonly particleMaterial: THREE.PointsMaterial
  private readonly mistMaterial: THREE.MeshBasicMaterial
  private readonly secondaryMistMaterial: THREE.MeshBasicMaterial
  private readonly particles: THREE.Points
  private readonly mist: THREE.Mesh
  private readonly secondaryMist: THREE.Mesh
  private active = false
  private elapsed = 0
  private duration = 1.65
  private direction: 1 | -1 = 1

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.domElement.className = 'world-journey__sweep-canvas'
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    container.append(this.renderer.domElement)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const offset = index * 3
      positions[offset] = (Math.random() - 0.5) * 9.6
      positions[offset + 1] = (Math.random() - 0.5) * 5.2
      positions[offset + 2] = -4.15 + Math.random() * 0.5
      this.particleColorSeeds[index] = Math.random()
    }
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    )
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.particleColors, 3),
    )

    this.particleMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      color: 0xffffff,
      size: 0.09,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      vertexColors: true,
    })
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial)
    this.particles.renderOrder = 102

    this.mistMaterial = new THREE.MeshBasicMaterial({
      map: this.mistTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    this.secondaryMistMaterial = this.mistMaterial.clone()
    this.mist = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 6.4), this.mistMaterial)
    this.mist.position.z = -4.4
    this.mist.renderOrder = 101
    this.secondaryMist = new THREE.Mesh(
      new THREE.PlaneGeometry(9.2, 5.7),
      this.secondaryMistMaterial,
    )
    this.secondaryMist.position.set(0.6, 0.34, -4.28)
    this.secondaryMist.rotation.z = -0.34
    this.secondaryMist.renderOrder = 100

    this.group.add(this.secondaryMist, this.mist, this.particles)
    this.group.visible = false
    this.camera.position.z = 0
    this.camera.add(this.group)
    this.scene.add(this.camera)
    this.group.visible = true
    this.renderer.render(this.scene, this.camera)
    this.renderer.clear()
    this.group.visible = false
  }

  play(
    direction: 1 | -1,
    colors: readonly string[],
    reducedMotion = false,
    duration = 1.65,
  ): void {
    this.direction = direction
    this.elapsed = 0
    this.duration = reducedMotion ? 0.08 : duration
    this.active = true
    this.group.visible = true
    this.group.position.x = direction * -SWEEP_DISTANCE
    this.group.rotation.z = direction * -0.08
    const palette = colors.map((color) => new THREE.Color(color))
    const particleColor = new THREE.Color()
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const seed = this.particleColorSeeds[index]
      const paletteIndex = seed < 0.56 ? 0 : seed < 0.84 ? 1 : 2
      particleColor.copy(palette[paletteIndex % palette.length] ?? palette[0])
      particleColor.multiplyScalar(0.82 + ((seed * 17.3) % 1) * 0.3)
      const offset = index * 3
      this.particleColors[offset] = particleColor.r
      this.particleColors[offset + 1] = particleColor.g
      this.particleColors[offset + 2] = particleColor.b
    }
    this.particleGeometry.getAttribute('color').needsUpdate = true
    this.mistMaterial.color.copy(palette[0] ?? new THREE.Color(0xffffff))
    this.secondaryMistMaterial.color.copy(palette[1] ?? palette[0])
    this.secondaryMist.position.x = direction * 0.6
    this.secondaryMist.rotation.z = direction * -0.34
    this.renderer.render(this.scene, this.camera)
  }

  update(delta: number): void {
    if (!this.active) return
    this.elapsed += delta
    const raw = Math.min(this.elapsed / this.duration, 1)
    const eased = raw * raw * (3 - 2 * raw)
    const presence = Math.pow(Math.sin(raw * Math.PI), 0.72)

    this.group.position.x = THREE.MathUtils.lerp(
      this.direction * -SWEEP_DISTANCE,
      this.direction * SWEEP_DISTANCE,
      eased,
    )
    this.group.position.y = Math.sin(raw * Math.PI * 2) * 0.13
    this.group.rotation.z = this.direction * THREE.MathUtils.lerp(-0.08, 0.1, eased)
    this.group.scale.setScalar(0.88 + presence * 0.28)
    this.particles.rotation.z += delta * this.direction * 0.12
    this.particleMaterial.opacity = presence
    this.mistMaterial.opacity = presence * 0.78
    this.secondaryMistMaterial.opacity = presence * 0.68
    this.secondaryMist.position.y = 0.34 + Math.sin(raw * Math.PI * 3) * 0.18
    this.renderer.render(this.scene, this.camera)

    if (raw >= 1) {
      this.active = false
      this.group.visible = false
      this.particleMaterial.opacity = 0
      this.mistMaterial.opacity = 0
      this.secondaryMistMaterial.opacity = 0
      this.renderer.clear()
    }
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  dispose(): void {
    this.particleGeometry.dispose()
    this.particleMaterial.dispose()
    this.particleTexture.dispose()
    this.mist.geometry.dispose()
    this.secondaryMist.geometry.dispose()
    this.mistMaterial.dispose()
    this.secondaryMistMaterial.dispose()
    this.mistTexture.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    this.scene.clear()
  }
}
