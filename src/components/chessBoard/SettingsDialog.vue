<template>
  <div class="dialog-overlay">
    <div class="dialog-modal" @mousedown.stop>
      <h2 class="bg-gray-300 p-1 mb-2 rounded-md text-center">Settings</h2>

      <div class="flex justify-between items-center mb-2">
        <label for="piece-set" class="mr-2 whitespace-nowrap">Piece Set</label>
        <select
          id="piece-set"
          class="text-gray-600 border border-gray-600 focus:outline-none font-medium rounded text-sm p-1"
          v-model="selectedPieceSet"
          @change="updatePieceSet"
        >
          <option v-for="[key, value] in Object.entries(chessPieceSet)" :key="key" :value="value">
            {{ value }}
          </option>
        </select>
      </div>

      <div class="flex justify-between items-center mb-2">
        <label for="board-image" class="mr-2 whitespace-nowrap">Board Image</label>
        <select
          id="board-image"
          class="text-gray-600 border border-gray-600 focus:outline-none font-medium rounded text-sm p-1"
          v-model="selectedBoardImage"
          @change="updateBoardImage"
        >
          <option v-for="[key, value] in Object.entries(chessBoardImage)" :key="key" :value="value">
            {{ key }}
          </option>
        </select>
      </div>

      <div class="flex justify-between items-center mb-2">
        <label for="show-attackers" class="mr-2 whitespace-nowrap">Show Attackers</label>

        <label class="inline-flex items-center cursor-pointer">
          <input
            id="show-attackers"
            type="checkbox"
            class="sr-only peer"
            v-model="showAttackers"
            @change="updateShowAttackers"
          />
          <div
            class="relative w-11 h-6 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
          ></div>
        </label>
      </div>

      <button @click="closeDialog" class="mt-2">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, ref } from 'vue'

const emit = defineEmits(['close', 'updatePieceSet', 'updateBoardImage', 'updateShowAttackers'])

const props = defineProps({
  selectedChessPieceSet: String,
  selectedChessBoardImage: String,
  chessPieceSet: Object,
  chessBoardImage: Object,
  showAttackers: Boolean,
})

const selectedPieceSet = ref(props.selectedChessPieceSet)
const selectedBoardImage = ref(props.selectedChessBoardImage)
const showAttackers = ref(props.showAttackers)

const updatePieceSet = () => {
  emit('updatePieceSet', selectedPieceSet.value)
}

const updateBoardImage = () => {
  emit('updateBoardImage', selectedBoardImage.value)
}

const updateShowAttackers = () => {
  emit('updateShowAttackers', showAttackers.value)
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
  align-items: stretch;
  justify-content: center;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  width: 300px;
}
</style>
