<script setup>
import { useRouter } from 'vue-router'
import { useBreakpoint } from '@/composables/useBreakpoint'
const router = useRouter()
const { isMobile } = useBreakpoint()
</script>
<template>
  <div :style="{
    minHeight: '100vh',
    background: 'var(--color-bg-app)',
    display: 'flex', flexDirection: 'column',
  }">
    <!-- Topbar -->
    <header :style="{
      background: 'var(--color-primary)',
      height: 'var(--topbar-h)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 var(--sp-lg)' : '0 var(--sp-2xl)',
      flexShrink: '0',
    }">
      <div
        :style="{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', cursor: 'pointer' }"
        @click="router.push('/')"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="9"  cy="9"  r="5" stroke="#FFC801" stroke-width="2.5"/>
          <circle cx="23" cy="9"  r="5" stroke="white"  stroke-width="2.5" opacity="0.7"/>
          <circle cx="9"  cy="23" r="5" stroke="white"  stroke-width="2.5" opacity="0.7"/>
          <circle cx="23" cy="23" r="5" stroke="#FFC801" stroke-width="2.5"/>
          <circle cx="16" cy="16" r="3.5" fill="#FFC801"/>
        </svg>
        <span :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
        }">
          <span :style="{ color: 'var(--color-text-on-primary)' }">Cooper</span>
          <span :style="{ color: 'var(--color-accent)' }">amigó</span>
        </span>
      </div>
      <span :style="{
        fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.6)',
        fontWeight: 'var(--fw-medium)',
      }">Portal de solicitudes</span>
    </header>

    <!-- Contenido -->
    <main :style="{
      flex: '1',
      maxWidth: '720px',
      width: '100%',
      margin: '0 auto',
      padding: isMobile ? 'var(--sp-lg) var(--sp-md)' : 'var(--sp-2xl) var(--sp-lg)',
    }">
      <slot />
    </main>

    <!-- Footer -->
    <footer :style="{
      textAlign: 'center',
      padding: 'var(--sp-xl)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-3)',
      fontWeight: 'var(--fw-medium)',
      borderTop: '1px solid var(--color-border-card)',
    }">
      Cooperamigó © 2026 · Su bienestar es nuestra razón de ser
    </footer>
  </div>
</template>
