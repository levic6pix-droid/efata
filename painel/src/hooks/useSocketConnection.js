import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

export function useSocketConnection(isEnabled, handlers) {
  const [socket, setSocket] = useState(null);
  const handlersRef = useRef(handlers);

  // Mantém os handlers sempre atualizados sem disparar o useEffect
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('novo_pedido', (data) => {
      if (handlersRef.current.onNovoPedido) handlersRef.current.onNovoPedido(data);
    });

    newSocket.on('dados_atualizados', (data) => {
      if (handlersRef.current.onDadosAtualizados) handlersRef.current.onDadosAtualizados(data);
    });

    newSocket.on('pedido_atualizado', (data) => {
      if (handlersRef.current.onPedidoAtualizado) handlersRef.current.onPedidoAtualizado(data);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [isEnabled]);

  return socket;
}