import React, { useState, useEffect } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery, CssBaseline } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { SocketContext, SocketManager } from './context/Socket/SocketContext';

import Routes from "./routes";
import Kanban from "./pages/Kanban";

// Previne a tela vermelha chata do ResizeObserver no ambiente de desenvolvimento
const originalError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (
    typeof message === "string" &&
    (message.includes("ResizeObserver loop limit exceeded") ||
     message.includes("ResizeObserver loop completed with undelivered notifications"))
  ) {
    return true; // Ignora o erro e não mostra a tela vermelha
  }
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
};

const queryClient = new QueryClient();

const App = () => {
    const [locale, setLocale] = useState(ptBR);

    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const preferredTheme = window.localStorage.getItem("preferredTheme");
    const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");

    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
            },
        }),
        []
    );

    const theme = createTheme(
        {
            scrollbarStyles: {
                "&::-webkit-scrollbar": {
                    width: '8px',
                    height: '8px',
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: mode === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                },
                "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                }
            },
            scrollbarStylesSoft: {
                "&::-webkit-scrollbar": {
                    width: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: mode === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                },
            },
            palette: {
                type: mode,
                
                // --- CORES PRINCIPAIS (Clean & Professional) ---
                // Verde oficial do WhatsApp (Sóbrio)
                primary: { main: "#038bda", contrastText: "#FFFFFF" },
                // Secundária: Rosa discreto para ações de perigo/destaque secundário
                secondary: { main: "#f50057", contrastText: "#FFFFFF" },
                
                // Texto: Preto suave (#1c2431) para leitura confortável
                textPrimary: mode === "light" ? "#1c2431" : "#e9edef",
                borderPrimary: mode === "light" ? "#e9edef" : "#2a3942",

                background: {
                    // Fundo geral: Bege suave (WhatsApp) ou Cinza muito claro (#f0f2f5)
                    default: mode === "light" ? "#f3f1f1" : "#1c2431",
                    // Papel/Cards: Branco puro
                    paper: mode === "light" ? "#FFFFFF" : "#1c2431",
                },

                // --- MAPEAMENTO LEGADO (Mantendo chaves, ajustando cores) ---
                
                // Quicktags: IMPORTANTE! Deixei cinza neutro.
                // Assim, a cor da tag que vem do banco de dados (queue.color) vai se destacar.
                quicktags: { main: mode === "light" ? "#667781" : "#8696a0" },
                
                // Botão Sair: Vermelho discreto
                sair: { main: mode === "light" ? "#d32f2f" : "#f44336" }, 
                
                // Vcard: Verde padrão
                vcard: { main: mode === "light" ? "#038bda" : "#038bda" },
                
                // Tons de cinza para componentes diversos
                dark: { main: mode === "light" ? "#333333" : "#F3F3F3" },
                light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
                
                // --- ELEMENTOS DE UI ESPECÍFICOS ---
                
                // Cabeçalho das Abas: Cinza muito claro para diferenciar do conteúdo branco
                tabHeaderBackground: mode === "light" ? "#FFFFFF" : "#1c2431",
                
                // Fundo da lista de tickets: Branco
                ticketlist: mode === "light" ? "#FFFFFF" : "#1c2431", 
                
                // Fundo de opções/menus
                optionsBackground: mode === "light" ? "#f0f2f5" : "#1F2937",
                
                // Texto secundário (datas, previews)
                options: mode === "light" ? "#54656f" : "#aebac1", 
                
                // Cor da fonte principal
                fontecor: mode === "light" ? "#1c2431" : "#e9edef",
                
                // Fundo da área principal (onde ficam os chats)
                fancyBackground: mode === "light" ? "#F9FAFB" : "#1F2937",

                messageLeftBackground: mode === "light" ? "#F3F4F6" : "#374151",
                messageRightBackground: mode === "light" ? "#0ba9c5" : "#034b75",
                quotedContainerLeftBackground: mode === 'light' ? "#F3F4F6" : "#374151",
                quotedContainerRightBackground: mode === 'light' ? "#0ca884" : "#065f46",
                messageInputWrapperBackground: mode === "light" ? "#E5E7EB" : "#1F2937",
                connectionTagBackground: mode === "light" ? "#E5E7EB" : "#374151",
                serachInputWrapperBackground: mode === "light" ? "#E5E7EB" : "#1F2937",
                activeTicketBackground: mode === "light" ? "#ECFDF5" : "#0F232B",
                editorToolbarBackground: mode === 'light' ? '#E5E7EB' : '#2d2d2d',
                laneKanbanBackground: mode === "light" ? "#F5F6F8" : "#1F2937",
                KanbanBackground: mode === "light" ? "#F5F5F5" : "#0b141a",
                chatBtnHover: mode === "light" ? "#E5E7EB" : "#1F2937",
                InputFiltersKanbanBackground: mode === "light" ? "#F5F6F8" : "#1F2937",
                welcomeMsgBackground: mode === "light" ? "#F8FAFC" : "#161d27",
                
                // Bordas de caixas: Cinza sutil
                bordabox: mode === "light" ? "#e9edef" : "#2a3942",
                
                // Caixa de digitar nova mensagem
                newmessagebox: mode === "light" ? "#f0f2f5" : "#1F2937",
                
                // Input branco para contraste
                inputdigita: mode === "light" ? "#FFFFFF" : "#2a3942",
                
                // Drawer (Menu Lateral): Branco
                contactdrawer: mode === "light" ? "#FFFFFF" : "#1c2431",
                
                // Avisos/Modais
                announcements: mode === "light" ? "#f0f2f5" : "#1F2937",
                login: mode === "light" ? "#FFFFFF" : "#1c2431",
                announcementspopover: mode === "light" ? "#FFFFFF" : "#1F2937",
                
                // Cores de fundo de listas
                chatlist: mode === "light" ? "#FFFFFF" : "#1c2431",
                boxlist: mode === "light" ? "#f0f2f5" : "#1F2937",
                boxchatlist: mode === "light" ? "#f0f2f5" : "#1F2937",
                
                // Badge de contador total
                total: mode === "light" ? "#038bda" : "#fff",
                
                // Ícones de mensagem (lido/não lido)
                messageIcons: mode === "light" ? "#54656f" : "#aebac1",
                
                // Fundo de inputs gerais
                inputBackground: mode === "light" ? "#FFFFFF" : "#2a3942",
                
                // Barra Superior: Cor Sólida (Sem gradiente)
                barraSuperior: mode === "light" ? 'linear-gradient(135deg, #10a0b9 0%, #038bda 25%, #038bda 50%, #10a0b9 75%, #038bda 100%)' : "#131924",
                
                // Outros elementos legados
                boxticket: mode === "light" ? "#F3F1F1" : "#1c2431",
                campaigntab: mode === "light" ? "#f0f2f5" : "#1F2937",
                mediainput: mode === "light" ? "#f0f2f5" : "#1F2937",
                contadordash: mode === "light" ? "#038bda" : "#e9edef",
            },
            shape: {
                borderRadius: 8, // Bordas suaves (8px), não redondas demais
            },
            mode,
        },
        locale
    );

    useEffect(() => {
        const i18nlocale = localStorage.getItem("i18nextLng");
        if (i18nlocale && i18nlocale.length >= 5) {
            const browserLocale = i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);
            if (browserLocale === "ptBR") {
                setLocale(ptBR);
            }
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem("preferredTheme", mode);
    }, [mode]);

    return (
        <ColorModeContext.Provider value={{ colorMode }}>
            <ThemeProvider theme={theme}>
                <QueryClientProvider client={queryClient}>
                    <SocketContext.Provider value={SocketManager}>
                        <CssBaseline />
                        <Routes />
                    </SocketContext.Provider>
                </QueryClientProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default App;