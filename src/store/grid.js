import { writable } from 'svelte/store';

// Grid store for managing grid items and edit mode
function createGridStore() {
  const initialState = {
    items: [],
    editMode: false,
    selectedItemId: null,
    draggedItem: null,
    dragOverPosition: null,
    gridSize: { cols: 4, rows: 6 } // Default 4x6 grid
  };
  
  const { subscribe, set, update } = writable(initialState);

  // Size progression order
  const sizeOrder = ['1x1', '2x2', '4x2'];

  return {
    subscribe,

    // Add item to grid - simplified for flexbox
    addItem(item) {
      update(state => {
        const newItem = {
          id: item.id || `item-${Date.now()}`,
          name: item.name,
          src: item.src,
          icon: item.icon,
          bgColor: item.bgColor,
          size: item.size || '1x1',
          ...item
        };

        return {
          ...state,
          items: [...state.items, newItem]
        };
      });
    },

    // Remove item from grid - simplified for flexbox
    removeItem(itemId) {
      update(state => {
        const updatedItems = state.items.filter(item => item.id !== itemId);
        return {
          ...state,
          items: updatedItems
        };
      });
    },

    // Update item size - simplified for flexbox
    updateItemSize(itemId) {
      update(state => {
        const itemIndex = state.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          return state;
        }

        const currentSize = state.items[itemIndex].size;
        const currentIndex = sizeOrder.indexOf(currentSize);
        const nextIndex = (currentIndex + 1) % sizeOrder.length;
        const newSize = sizeOrder[nextIndex];

        // Update the item size - flexbox handles positioning automatically
        const updatedItems = [...state.items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          size: newSize
        };

        return {
          ...state,
          items: updatedItems
        };
      });
    },

    // Move item - improved to handle different sizes and grid positions
    moveItem(itemId, targetItemId) {
      update(state => {
        const items = [...state.items];
        const draggedItemIndex = items.findIndex(item => item.id === itemId);
        const targetItemIndex = items.findIndex(item => item.id === targetItemId);
        
        if (draggedItemIndex === -1 || targetItemIndex === -1) return state;

        const draggedItem = items[draggedItemIndex];
        const targetItem = items[targetItemIndex];

        // Remove the dragged item
        items.splice(draggedItemIndex, 1);

        // Find the new index for the target item (it may have shifted after removing the dragged item)
        const newTargetIndex = items.findIndex(item => item.id === targetItemId);
        
        // Insert the dragged item at the target position
        items.splice(newTargetIndex, 0, draggedItem);

        return {
          ...state,
          items
        };
      });
    },

    // Optimize grid layout to minimize gaps and improve visual order
    optimizeLayout() {
      update(state => {
        const { cols } = state.gridSize;
        const items = [...state.items];
        
        // Sort items by size (larger items first) for better packing
        const sortedItems = items.sort((a, b) => {
          const sizeOrder = { '4x2': 3, '2x2': 2, '1x1': 1 };
          return sizeOrder[b.size] - sizeOrder[a.size];
        });

        return {
          ...state,
          items: sortedItems
        };
      });
    },

    // Move item by index (legacy support)
    moveItemByIndex(itemId, newIndex) {
      update(state => {
        const items = [...state.items];
        const itemIndex = items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return state;

        const [item] = items.splice(itemIndex, 1);
        items.splice(newIndex, 0, item);

        return {
          ...state,
          items
        };
      });
    },

    // Move item to a specific position index
    moveItemToPosition(itemId, positionIndex) {
      update(state => {
        const items = [...state.items];
        const itemIndex = items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return state;

        const [item] = items.splice(itemIndex, 1);
        
        // Clamp position to valid range
        const clampedPosition = Math.max(0, Math.min(items.length, positionIndex));
        items.splice(clampedPosition, 0, item);

        return {
          ...state,
          items
        };
      });
    },

    // Set edit mode
    setEditMode(editMode) {
      update(state => ({
        ...state,
        editMode,
        selectedItemId: editMode ? state.selectedItemId : null
      }));
    },

    // Set selected item
    setSelectedItem(itemId) {
      update(state => ({
        ...state,
        selectedItemId: itemId
      }));
    },

    // Set dragged item
    setDraggedItem(itemId) {
      update(state => ({
        ...state,
        draggedItem: itemId
      }));
    },

    // Set drag over position
    setDragOverPosition(position) {
      update(state => ({
        ...state,
        dragOverPosition: position
      }));
    },

    // Clear drag state
    clearDragState() {
      update(state => ({
        ...state,
        draggedItem: null,
        dragOverPosition: null
      }));
    },

    // Set grid size
    setGridSize(cols, rows) {
      update(state => ({
        ...state,
        gridSize: { cols, rows }
      }));
    },

    // Initialize with default items
    initializeDefaultItems() {
      const defaultItems = [
        {
          id: 'app-a',
          name: 'App a',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-blue-500',
          size: '2x2'
        },
        {
          id: 'app-b',
          name: 'App b',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-green-500',
          size: '2x2'
        },
        {
          id: 'app-c',
          name: 'App c',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-purple-500',
          size: '4x2'
        },
        {
          id: 'app-d',
          name: 'App d',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-red-500',
          size: '1x1'
        },
        {
          id: 'app-e',
          name: 'App e',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-yellow-500',
          size: '4x2'
        },
        {
          id: 'app-f',
          name: 'App f',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-pink-500',
          size: '1x1'
        },
        {
          id: 'app-g',
          name: 'App g',
          src: '/settings',
          icon: 'mdi:settings',
          bgColor: 'bg-indigo-500',
          size: '1x1'
        }
      ];

      set({
        items: defaultItems,
        editMode: false,
        selectedItemId: null,
        draggedItem: null,
        dragOverPosition: null,
        gridSize: { cols: 4, rows: 6 }
      });
    }
  };
}

export const gridStore = createGridStore();