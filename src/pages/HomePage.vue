<script setup>
import { useRouter } from 'vue-router'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import { CreditCard, UserPlus, ArrowRight } from 'lucide-vue-next'
const router = useRouter()
</script>

<template>
  <PortalLayout>
    <!-- Hero -->
    <div :style="{ textAlign: 'center', marginBottom: 'var(--sp-2xl)' }">
      <div :style="{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)',
        color: 'var(--color-text-1)', marginBottom: 'var(--sp-md)',
        lineHeight: '1.2',
      }">
        ¿En qué le podemos ayudar?
      </div>
      <div :style="{
        fontSize: 'var(--text-lg)', color: 'var(--color-text-2)',
        fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
        maxWidth: '480px', margin: '0 auto',
      }">
        Seleccione el trámite que desea realizar.
        Lo guiamos paso a paso.
      </div>
    </div>

    <!-- Cards opciones -->
    <div :style="{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-lg)', marginBottom: 'var(--sp-2xl)',
    }">

      <!-- Solicitar crédito -->
      <div
        :style="{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-card)',
          borderRadius: 'var(--r-2xl)',
          padding: 'var(--sp-2xl)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          display: 'flex', flexDirection: 'column',
        }"
        @mouseenter="e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-modal)'
          e.currentTarget.style.borderColor = 'var(--color-primary)'
        }"
        @mouseleave="e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.borderColor = 'var(--color-border-card)'
        }"
        @click="router.push('/solicitar-credito')"
      >
        <div :style="{
          width: '56px', height: '56px', borderRadius: 'var(--r-xl)',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--sp-lg)',
        }">
          <CreditCard :size="26" :style="{ color: 'var(--color-primary)' }" />
        </div>
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)',
        }">Solicitar crédito</div>
        <div :style="{
          fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
          fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
          flex: '1', marginBottom: 'var(--sp-xl)',
        }">
          Consumo, vivienda, educativo o emergencia.
          Formulario rápido en 3 pasos.
        </div>
        <div :style="{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
          fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)',
          color: 'var(--color-primary)',
        }">
          Iniciar solicitud <ArrowRight :size="16" />
        </div>
      </div>

      <!-- Solicitar afiliación -->
      <div
        :style="{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-card)',
          borderRadius: 'var(--r-2xl)',
          padding: 'var(--sp-2xl)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          display: 'flex', flexDirection: 'column',
        }"
        @mouseenter="e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-modal)'
          e.currentTarget.style.borderColor = 'var(--color-accent)'
        }"
        @mouseleave="e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-card)'
          e.currentTarget.style.borderColor = 'var(--color-border-card)'
        }"
        @click="router.push('/solicitar-afiliacion')"
      >
        <div :style="{
          width: '56px', height: '56px', borderRadius: 'var(--r-xl)',
          background: 'var(--color-warning-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--sp-lg)',
        }">
          <UserPlus :size="26" :style="{ color: 'var(--color-warning-text)' }" />
        </div>
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-text-1)', marginBottom: 'var(--sp-sm)',
        }">Afiliarme a Cooperamigó</div>
        <div :style="{
          fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
          fontWeight: 'var(--fw-medium)', lineHeight: '1.6',
          flex: '1', marginBottom: 'var(--sp-xl)',
        }">
          Haga parte de nuestra comunidad cooperativa y
          acceda a todos los beneficios.
        </div>
        <div :style="{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)',
          fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)',
          color: 'var(--color-warning-text)',
        }">
          Iniciar afiliación <ArrowRight :size="16" />
        </div>
      </div>
    </div>

    <!-- Info -->
    <div :style="{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--r-xl)',
      padding: 'var(--sp-xl) var(--sp-2xl)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', alignItems: 'center',
      gap: 'var(--sp-xl)', flexWrap: 'wrap',
    }">
      <div v-for="item in [
        { valor: '4 pasos',     desc: 'Formulario guiado'     },
        { valor: '100% online', desc: 'Sin filas ni papeleos' },
        { valor: 'Inmediato',   desc: 'Confirmación al instante' },
      ]" :key="item.valor" :style="{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', flex: '1', minWidth: '120px',
      }">
        <div :style="{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
          color: 'var(--color-primary)',
        }">{{ item.valor }}</div>
        <div :style="{
          fontSize: 'var(--text-sm)', color: 'var(--color-text-3)',
          fontWeight: 'var(--fw-medium)', marginTop: '2px',
        }">{{ item.desc }}</div>
      </div>
    </div>
  </PortalLayout>
</template>
