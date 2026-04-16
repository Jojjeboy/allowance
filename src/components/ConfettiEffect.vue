<script setup lang="ts">
import { ref } from 'vue'
import confetti from 'canvas-confetti'

const el = ref<HTMLCanvasElement | null>(null)

function trigger(
  options: { colors?: string[]; particleCount?: number; spread?: number } = {},
) {
  const colors = options.colors ?? ['#a855f7', '#ec4899', '#facc15', '#f97316', '#d8b4fe']
  const particleCount = options.particleCount ?? 160
  const spread = options.spread ?? 100

  // Two-burst from sides effect
  confetti({
    particleCount: Math.floor(particleCount * 0.6),
    angle: 60,
    spread,
    origin: { x: 0, y: 0.65 },
    colors,
  })
  confetti({
    particleCount: Math.floor(particleCount * 0.6),
    angle: 120,
    spread,
    origin: { x: 1, y: 0.65 },
    colors,
  })
  // Center burst
  setTimeout(() => {
    confetti({
      particleCount: Math.floor(particleCount * 0.4),
      spread: 70,
      origin: { x: 0.5, y: 0.4 },
      colors,
      scalar: 1.2,
    })
  }, 150)
}

defineExpose({ trigger })
</script>

<template>
  <canvas ref="el" class="pointer-events-none fixed inset-0 z-[9999] w-full h-full" />
</template>
