import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  cart: [],
  isCartOpen: false,
  
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setCartOpen: (open) => set({ isCartOpen: open }),
  
  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find((item) => item.id === product.id);
    
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
    set({ isCartOpen: true });
  },
  
  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  },
  
  updateQuantity: (id, delta) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    }));
  },
  
  clearCart: () => set({ cart: [] }),
  
  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));

export default useCartStore;
