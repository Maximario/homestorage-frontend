<template>
  <div class="tree-select">
    <!-- Выбранное значение -->
    <div class="tree-select__selected" @click="toggleDropdown">
      <span v-if="selectedLabel" class="tree-select__label">
        {{ selectedLabel }}
      </span>
      <span v-else class="tree-select__placeholder">Выберите родительское место...</span>
      <span class="tree-select__actions">
        <span
            v-if="selectedLabel"
            class="tree-select__clear"
            @click.stop="clearSelection"
        >
          ✕
        </span>
        <span class="tree-select__arrow">▼</span>
      </span>
    </div>

    <!-- Выпадающее дерево -->
    <div v-if="isOpen" class="tree-select__dropdown">
      <div class="tree-select__search">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск..."
            class="tree-select__search-input"
        />
        <button
            v-if="searchQuery"
            class="tree-select__search-clear"
            @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
      <div class="tree-select__tree">
        <!-- 🔥 Опция "Без родителя" -->
        <div
            class="tree-select__no-parent"
            @click="selectNoParent"
        >
          <span class="tree-select__no-parent-icon">🌳</span>
          <span>Без родителя (корневое)</span>
        </div>
        <TreeNode
            v-for="node in filteredTree"
            :key="node.id"
            :node="node"
            :level="0"
            :selected-id="selectedId"
            @select="selectNode"
            @toggle="toggleNode"
            :expanded-ids="expandedIds"
            :valid-types="validChildTypes"
        />
      </div>
      <div v-if="filteredTree.length === 0" class="tree-select__empty">
        Нет доступных родительских мест
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TreeNode from './TreeNode.vue';

interface TreeNodeData {
  id: string;
  name: string;
  type: string;
  children: TreeNodeData[];
}

const props = defineProps<{
  modelValue: string | undefined;
  treeData: TreeNodeData[];
  validChildTypes?: string[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const expandedIds = ref<Set<string>>(new Set());

const selectedId = computed(() => props.modelValue);

const selectedLabel = computed(() => {
  if (!selectedId.value) return '';
  const findNode = (nodes: TreeNodeData[]): string | undefined => {
    for (const node of nodes) {
      if (node.id === selectedId.value) return node.name;
      const found = findNode(node.children);
      if (found) return found;
    }
    return undefined;
  };
  return findNode(props.treeData) || '';
});

const filteredTree = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.treeData;
  }
  const query = searchQuery.value.toLowerCase();
  const filterNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes
        .map(node => ({
          ...node,
          children: filterNodes(node.children),
        }))
        .filter(node =>
            node.name.toLowerCase().includes(query) ||
            node.children.length > 0
        );
  };
  return filterNodes(props.treeData);
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectNode = (node: TreeNodeData) => {
  emit('update:modelValue', node.id);
  isOpen.value = false;
};

const selectNoParent = () => {
  emit('update:modelValue', undefined);
  isOpen.value = false;
};

const clearSelection = () => {
  emit('update:modelValue', undefined);
};

const toggleNode = (nodeId: string) => {
  if (expandedIds.value.has(nodeId)) {
    expandedIds.value.delete(nodeId);
  } else {
    expandedIds.value.add(nodeId);
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.tree-select')) {
    isOpen.value = false;
  }
};

watch(isOpen, (newVal) => {
  if (newVal) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.tree-select {
  position: relative;
  width: 100%;
}

.tree-select__selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  user-select: none;
  transition: border-color 0.2s;
}

.tree-select__selected:hover {
  border-color: #1976d2;
}

.tree-select__label {
  color: #333;
  flex: 1;
}

.tree-select__placeholder {
  color: #999;
  flex: 1;
}

.tree-select__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-select__clear {
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: color 0.2s;
}

.tree-select__clear:hover {
  color: #d32f2f;
}

.tree-select__arrow {
  color: #666;
  font-size: 12px;
  transition: transform 0.2s;
}

.tree-select__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 350px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.tree-select__search {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.tree-select__search-input {
  width: 100%;
  padding: 6px 32px 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.tree-select__search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
}

.tree-select__search-clear:hover {
  color: #d32f2f;
}

.tree-select__tree {
  overflow-y: auto;
  padding: 4px 0;
  max-height: 280px;
}

.tree-select__no-parent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
  color: #1976d2;
}

.tree-select__no-parent:hover {
  background: #e3f2fd;
}

.tree-select__no-parent-icon {
  font-size: 16px;
}

.tree-select__empty {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>