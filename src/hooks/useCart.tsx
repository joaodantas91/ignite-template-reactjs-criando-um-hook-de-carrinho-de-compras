import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productIndex = cart.findIndex(product => product.id === productId);
      const {data: stock} = await api.get(`stock/${productId}`);

      if (stock.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return undefined;
      }
      if (productIndex !== -1) {
        const amount = cart[productIndex].amount + 1;
        updateProductAmount({ productId, amount });
        return undefined;
      }

      const {data: newProduct} = await api.get(`products/${productId}`);
      const cartWithNewProduct = [...cart, {...newProduct, amount: 1}]
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithNewProduct))
      setCart(cartWithNewProduct);
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const isProductOnCart = cart.findIndex((product) => product.id === productId);
      if (isProductOnCart === -1) {
        throw new Error();
      }

      const newCart = cart.filter((product) => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart);
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const {data: stock} = await api.get(`stock/${productId}`);
      if (stock.amount <= 0 || amount < 1) {
        return undefined;
      }

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return undefined;
      }
      
      const productIndex = cart.findIndex(product => product.id === productId);
      const newCart = cart.map((cartProduct, index) => {
        if (productIndex === index) {
          return {
            ...cartProduct,
            amount: amount
          }
        }
        return cartProduct;
      })

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
