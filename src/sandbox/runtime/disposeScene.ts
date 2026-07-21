import * as THREE from 'three'

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  }

  material.dispose()
}

export function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()

    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial)
    } else {
      disposeMaterial(object.material)
    }
  })

  scene.clear()
}
