import React, { createContext, useContext, useState } from 'react';

interface RoomContextProps {
  roomInfo: Room | null | undefined;
  setRoomInfo: React.Dispatch<React.SetStateAction<Room | null | undefined>>;
  pass: string;
  setPass: React.Dispatch<React.SetStateAction<string>>;
}

const RoomContext = createContext<RoomContextProps | undefined>(undefined);

export const RoomProvider = ({ children }) => {
  const [roomInfo, setRoomInfo] = useState<Room | null | undefined>(null);
  const [pass, setPass] = useState<string>("");



  return (
    <RoomContext.Provider value={{ roomInfo, setRoomInfo, pass, setPass }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = (): RoomContextProps => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
