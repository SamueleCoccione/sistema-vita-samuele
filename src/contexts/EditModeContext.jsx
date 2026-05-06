import { createContext, useContext, useState } from 'react';

const EditModeContext = createContext(null);

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false);
  return (
    <EditModeContext.Provider value={{
      isEditMode,
      enterEditMode: () => setIsEditMode(true),
      exitEditMode:  () => setIsEditMode(false),
    }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode must be used inside <EditModeProvider>');
  return ctx;
}
