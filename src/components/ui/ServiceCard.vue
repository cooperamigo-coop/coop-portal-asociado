<script setup>
import { computed } from 'vue'
import { IconClock, IconArrowRight } from '@tabler/icons-vue'

const props = defineProps({
  icon:        { type: [Object, Function], required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  href:        { type: String, default: null },
  clickable:   { type: Boolean, default: false },
  soon:        { type: Boolean, default: false },
  selected:    { type: Boolean, default: false },
  actionLabel: { type: String, default: 'Conoce más' },
  showAction:  { type: Boolean, default: true },
})

defineEmits(['click'])

const isInteractive = computed(() => !props.soon && (!!props.href || props.clickable))
const tag = computed(() => props.href ? 'a' : (props.clickable ? 'button' : 'div'))
</script>

<template>
  <component
    :is="tag"
    class="service-card"
    :class="{ 'service-card--static': !isInteractive, 'service-card--soon': soon, 'service-card--selected': selected }"
    :type="tag === 'button' ? 'button' : undefined"
    :href="href || undefined"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    @click="clickable && $emit('click')"
  >
    <div class="sc-icon-wrapper">
      <component :is="icon" class="sc-icon" :size="36" stroke-width="1.5" />
    </div>
    <div class="sc-content">
      <h4 class="sc-title">{{ title }}</h4>
      <div class="sc-desc-wrapper" v-if="description">
        <div class="sc-desc-inner">
          <p class="sc-desc">{{ description }}</p>
        </div>
      </div>
    </div>
    <div class="sc-link" v-if="isInteractive && showAction">
      {{ actionLabel }} <IconArrowRight :size="18" />
    </div>
    <span v-if="soon" class="sc-soon">
      <IconClock :size="14" />
      Pronto
    </span>
  </component>
</template>

<style scoped>
.service-card {
  background: var(--color-bg-surface-alt);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  border: 1px solid transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background-color 0.4s ease, border-color 0.4s ease;
  position: relative;
  text-decoration: none;
  color: inherit;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.service-card--static {
  cursor: default;
}

.service-card:hover:not(.service-card--static) {
  background-color: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.service-card:hover:not(.service-card--static) .sc-desc-wrapper {
  grid-template-rows: 1fr;
}

.service-card:hover:not(.service-card--static) .sc-desc {
  opacity: 1;
}

.service-card:hover:not(.service-card--static) .sc-link {
  transform: translateX(4px);
  color: var(--color-primary);
}

.service-card--soon {
  opacity: 0.6;
}

.service-card--selected {
  background-color: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 1.5px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.service-card--selected .sc-desc-wrapper {
  grid-template-rows: 1fr;
}

.service-card--selected .sc-desc {
  opacity: 1;
}

.sc-soon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: var(--fw-bold);
  color: var(--color-text-2);
  background: rgba(0,0,0,0.05);
  padding: 4px 10px;
  border-radius: var(--r-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  margin-top: 16px;
}

.sc-icon-wrapper {
  color: #4d7480;
  margin-bottom: 16px;
}

.sc-content {
  width: 100%;
}

.sc-title {
  font-size: 1rem;
  font-weight: var(--fw-bold);
  color: var(--color-text-1);
  margin: 0;
}

.sc-desc-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sc-desc-inner {
  overflow: hidden;
}

.sc-desc {
  font-size: 0.95rem;
  color: var(--color-text-2);
  line-height: 1.2;
  margin: 8px 0 0 0;
  opacity: 0;
  transition: opacity 0.3s ease 0.1s;
}

.sc-link {
  margin-top: 24px;
  color: var(--color-text-2);
  font-weight: var(--fw-regular);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  transition: transform 0.3s ease, color 0.3s ease;
}
</style>
