<template>
  <div class="dialog-overlay" @mousedown="closeDialog">
    <div class="dialog-modal" @mousedown.stop>
      <h2>Settings</h2>
      <select
        class="text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring font-medium rounded text-sm px-2 py-2 text-center inline-flex items-center"
        v-model="selectedPieceSet"
        @change="updatePieceSet"
      >
        <option v-for="[key, value] in Object.entries(chessPieceSet)" :key="key" :value="value">
          {{ value }}
        </option>
      </select>
      <select
        class="text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring font-medium rounded text-sm px-2 py-2 text-center inline-flex items-center"
        v-model="selectedBoardImage"
        @change="updateBoardImage"
      >
        <option v-for="[key, value] in Object.entries(chessBoardImage)" :key="key" :value="value">
          {{ key }}
        </option>
      </select>
      <button @click="closeDialog">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, ref } from 'vue'

const emit = defineEmits(['close', 'updatePieceSet', 'updateBoardImage'])

const props = defineProps({
  selectedChessPieceSet: String,
  selectedChessBoardImage: String,
  chessPieceSet: Object,
  chessBoardImage: Object,
})

const selectedPieceSet = ref(props.selectedChessPieceSet)
const selectedBoardImage = ref(props.selectedChessBoardImage)

const updatePieceSet = () => {
  emit('updatePieceSet', selectedPieceSet.value)
}

// Emit the new selected board image value
const updateBoardImage = () => {
  emit('updateBoardImage', selectedBoardImage.value)
}
const closeDialog = () => {
  emit('close')
}
</script>

<style scoped>
.dialog-overlay {
  top: 0;
  left: 0;
  z-index: 9;
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-modal {
  top: 50%;
  left: 50%;
  z-index: 10;
  display: flex;
  position: inherit;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
</style>
