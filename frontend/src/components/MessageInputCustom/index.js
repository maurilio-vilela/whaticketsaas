import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";
import { isNil } from "lodash";
import { 
    Reply, 
    ChevronLeft, 
    ChevronRight, 
    Message, 
    TrendingUp, 
    Close,
    FormatBold,
    FormatItalic,
    StrikethroughS,
    Code,
    List as ListIcon,
    FormatListNumbered,
    FormatQuote,
    Send as SendIcon
} from "@material-ui/icons";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Paper,
  InputBase,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Box,
  Typography,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  Tooltip,
  Divider,
  Slide,
  Fade
} from "@material-ui/core";
import { green, grey, blue, pink, purple, orange } from "@material-ui/core/colors";

// Ícones
import MoodIcon from "@material-ui/icons/Mood";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import AddIcon from "@material-ui/icons/Add";
import ImageIcon from "@material-ui/icons/Image";
import DescriptionIcon from "@material-ui/icons/Description";
import VideocamIcon from "@material-ui/icons/Videocam";
import LocationOnIcon from "@material-ui/icons/LocationOn";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import axios from "axios";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";
import Compressor from 'compressorjs';
import LinearWithValueLabel from "./ProgressBarCustom";
import useQuickMessages from "../../hooks/useQuickMessages";

// Import do Modal de Encaminhamento
import ForwardMessageModal from "../ForwardMessageModal";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

// Transição suave para o Modal Mobile
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    backgroundColor: theme.palette.background.paper, 
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    boxShadow: "0 -4px 10px rgba(0,0,0,0.02)", 
    position: "relative",
    zIndex: 20,
  },
  newMessageBox: {
    backgroundColor: "transparent",
    width: "100%",
    display: "flex",
    padding: "12px 16px",
    alignItems: "flex-end", 
  },
  messageInputWrapper: {
    padding: "8px 14px",
    margin: "0 8px",
    backgroundColor: theme.palette.messageInputWrapperBackground || (theme.palette.mode === 'light' ? "#F3F4F6" : "#333"), 
    display: "flex",
    borderRadius: 24, 
    flex: 1,
    alignItems: "flex-end", 
    border: "1px solid transparent",
    transition: "all 0.3s ease",
    "&:focus-within": {
       backgroundColor: theme.palette.background.paper,
       border: `1px solid ${theme.palette.primary.main}`, 
       boxShadow: `0 0 0 2px ${theme.palette.mode === 'light' ? '#D1FAE5' : '#064E3B'}`, 
    }
  },
  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  // Classe aplicada diretamente ao input HTML para controlar o scroll
  inputBaseInput: {
     maxHeight: "120px", 
     overflowY: "auto !important", 
  },
  sendMessageIcons: {
    color: theme.palette.text.secondary,
    transition: "color 0.2s",
    "&:hover": {
        color: theme.palette.primary.main, 
    }
  },
  ForwardMessageIcons: {
    color: theme.palette.primary.main,
    transform: 'scaleX(-1)',
  },
  uploadInput: {
    display: "none",
  },
  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.background.paper,
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    minHeight: "60px",
  },
  emojiBox: {
    position: "absolute",
    bottom: 70,
    left: 20,
    zIndex: 50,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    "& .emoji-mart": {
        border: "none",
        backgroundColor: theme.palette.background.paper,
    },
    "& .emoji-mart-bar": {
        backgroundColor: theme.palette.background.paper,
    }
  },
  
  // --- ESTILOS DO EDITOR AVANÇADO ---
  dialogPaper: {
    borderRadius: 16,
    height: '50vh', // Altura fixa para desktop (50% da tela)
    [theme.breakpoints.down('sm')]: {
        borderRadius: 0,
        margin: 0,
        height: '100%',
        maxHeight: '100%',
    }
  },
  editorToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.editorToolbarBackground,
    overflowX: 'auto',
    '&::-webkit-scrollbar': { display: 'none' }, // Esconder scrollbar horizontal
  },
  toolbarDivider: {
    height: 24,
    margin: '0 8px',
    backgroundColor: theme.palette.divider
  },
  editorContent: {
    padding: '16px',
    backgroundColor: theme.palette.background.paper,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  editorField: {
    flexGrow: 1,
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: '16px',
    lineHeight: '1.6',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    '&::placeholder': {
        color: theme.palette.text.secondary,
        opacity: 0.7
    }
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
    color: theme.palette.text.secondary,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.primary.main,
    }
  },
  charCounter: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
      marginRight: 'auto',
      marginLeft: '16px'
  },
  // ----------------------------------

  attachmentMenu: {
    position: "absolute",
    bottom: "75px",
    left: "10px",
    width: "220px",
    backgroundColor: theme.palette.background.paper,
    borderRadius: "16px", 
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)", 
    zIndex: 40,
    overflow: "hidden",
    padding: "8px 0",
  },
  attachmentMenuItem: {
      padding: "10px 20px",
      "&:hover": {
          backgroundColor: theme.palette.action.hover,
      }
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    margin: "0 8px",
    backgroundColor: theme.palette.mode === 'light' ? "#FEE2E2" : "#7F1D1D", 
    borderRadius: 30,
    padding: "6px 16px",
    animation: "$pulse 1.5s infinite", 
  },
  "@keyframes pulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
    "70%": { boxShadow: "0 0 0 10px rgba(239, 68, 68, 0)" },
    "100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
  },
  cancelAudioIcon: {
    color: "#EF4444", 
  },
  sendAudioIcon: {
    color: "#10B981", 
  },
  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "transparent",
  },
  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: theme.palette.mode === 'light' ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    display: "flex",
    position: "relative",
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
  replyginMsgBody: {
    padding: "8px 12px",
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    fontSize: "0.9rem",
    color: theme.palette.text.secondary,
  },
  messageContactName: {
    display: "flex",
    color: theme.palette.primary.main,
    fontWeight: 600,
    marginBottom: 2,
    fontSize: "0.8rem",
  },
  quickMessagesWrapper: {
    position: 'relative',
    width: '100%',
    backgroundColor: theme.palette.background.default, 
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },
  quickMessagesContainer: {
    display: 'flex',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    padding: '10px 20px',
    gap: '10px',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  quickMessageButton: {
    borderRadius: '20px', 
    padding: '6px 16px',
    fontSize: '0.8rem',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    whiteSpace: "nowrap",
    minWidth: "fit-content",
    textTransform: "none",
    "&:hover": {
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
        borderColor: theme.palette.primary.main,
    }
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 5,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    padding: 6,
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '&.left': { left: 0 },
    '&.right': { right: 0 },
  },
}));

// --- COMPONENTE EDITOR DE TEXTO AVANÇADO ---
const TextEditorModal = ({ open, onClose, initialValue, onSave }) => {
    const classes = useStyles();
    const theme = useTheme();
    // Mobile-first: Fullscreen em telas pequenas (xs, sm)
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if(open) {
            setValue(initialValue);
            // Focar no final do texto ao abrir
            setTimeout(() => {
                if(inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(initialValue.length, initialValue.length);
                }
            }, 100);
        }
    }, [open, initialValue]);

    // Lógica de Formatação
    const applyFormat = (formatType) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        const selectedText = text.substring(start, end);
        
        let newText = text;
        let newCursorPos = end;

        switch (formatType) {
            case 'bold': // *texto*
                newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
                newCursorPos = end + 2;
                break;
            case 'italic': // _texto_
                newText = text.substring(0, start) + '_' + selectedText + '_' + text.substring(end);
                newCursorPos = end + 2;
                break;
            case 'strikethrough': // ~texto~
                newText = text.substring(0, start) + '~' + selectedText + '~' + text.substring(end);
                newCursorPos = end + 2;
                break;
            case 'monospace': // ```texto```
                newText = text.substring(0, start) + '```' + selectedText + '```' + text.substring(end);
                newCursorPos = end + 6;
                break;
            case 'inlinecode': // `texto`
                newText = text.substring(0, start) + '`' + selectedText + '`' + text.substring(end);
                newCursorPos = end + 2;
                break;
            case 'ul': // * item
                newText = text.substring(0, start) + (start === 0 || text[start-1] === '\n' ? '' : '\n') + '* ' + selectedText + text.substring(end);
                newCursorPos = end + 2 + (start === 0 || text[start-1] === '\n' ? 0 : 1);
                break;
            case 'ol': // 1. item
                newText = text.substring(0, start) + (start === 0 || text[start-1] === '\n' ? '' : '\n') + '1. ' + selectedText + text.substring(end);
                newCursorPos = end + 3 + (start === 0 || text[start-1] === '\n' ? 0 : 1);
                break;
            case 'quote': // > item
                newText = text.substring(0, start) + (start === 0 || text[start-1] === '\n' ? '' : '\n') + '> ' + selectedText + text.substring(end);
                newCursorPos = end + 2 + (start === 0 || text[start-1] === '\n' ? 0 : 1);
                break;
            default:
                break;
        }
        
        setValue(newText);
        
        setTimeout(() => {
            input.focus();
            if (selectedText.length > 0 && ['bold', 'italic', 'strikethrough', 'monospace', 'inlinecode'].includes(formatType)) {
                // Seleciona o texto formatado (incluindo marcadores)
                // Ajuste fino do cursor
                input.setSelectionRange(start, end + (newText.length - text.length));
            } else {
                // Posiciona o cursor após a formatação ou no meio (se sem seleção)
                if(selectedText.length === 0 && ['bold', 'italic', 'strikethrough', 'monospace', 'inlinecode'].includes(formatType)) {
                     const halfMarker = (newText.length - text.length) / 2;
                     input.setSelectionRange(start + halfMarker, start + halfMarker);
                } else {
                     input.setSelectionRange(newCursorPos, newCursorPos);
                }
            }
        }, 50);
    };

    // Atalhos de Teclado
    const handleKeyDown = (e) => {
        // Enviar com Shift+Enter
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            onSave(value);
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b': e.preventDefault(); applyFormat('bold'); break;
                case 'i': e.preventDefault(); applyFormat('italic'); break;
                case 'e': e.preventDefault(); applyFormat('monospace'); break;
                // Adicione outros atalhos aqui
                default: 
                    // Atalho composto Ctrl+Shift+X para Riscado
                    if (e.shiftKey && e.key.toLowerCase() === 'x') {
                        e.preventDefault(); applyFormat('strikethrough');
                    }
                    break;
            }
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullScreen={isMobile}
            fullWidth
            maxWidth="md"
            classes={{ paper: classes.dialogPaper }}
            TransitionComponent={isMobile ? Transition : Fade}
        >
            {/* TOOLBAR */}
            <div className={classes.editorToolbar}>
                <Typography variant="body2" style={{color: theme.palette.text.secondary, fontWeight: 'bold', marginRight: 8, display: isMobile ? 'none' : 'block'}}>
                    Formatar:
                </Typography>
                
                <Tooltip title="Negrito (Ctrl+B)">
                    <IconButton size="small" onClick={() => applyFormat('bold')} className={classes.toolbarButton}><FormatBold fontSize="small"/></IconButton>
                </Tooltip>
                <Tooltip title="Itálico (Ctrl+I)">
                    <IconButton size="small" onClick={() => applyFormat('italic')} className={classes.toolbarButton}><FormatItalic fontSize="small"/></IconButton>
                </Tooltip>
                <Tooltip title="Riscado (Ctrl+Shift+X)">
                    <IconButton size="small" onClick={() => applyFormat('strikethrough')} className={classes.toolbarButton}><StrikethroughS fontSize="small"/></IconButton>
                </Tooltip>
                
                <div className={classes.toolbarDivider} />

                <Tooltip title="Monoespaçado (Ctrl+E)">
                    <IconButton size="small" onClick={() => applyFormat('monospace')} className={classes.toolbarButton}><Code fontSize="small"/></IconButton>
                </Tooltip>
                <Tooltip title="Lista com marcas">
                    <IconButton size="small" onClick={() => applyFormat('ul')} className={classes.toolbarButton}><ListIcon fontSize="small"/></IconButton>
                </Tooltip>
                <Tooltip title="Lista numerada">
                    <IconButton size="small" onClick={() => applyFormat('ol')} className={classes.toolbarButton}><FormatListNumbered fontSize="small"/></IconButton>
                </Tooltip>
                <Tooltip title="Citação">
                    <IconButton size="small" onClick={() => applyFormat('quote')} className={classes.toolbarButton}><FormatQuote fontSize="small"/></IconButton>
                </Tooltip>

                <div style={{flexGrow: 1}} />
                
                <Tooltip title="Fechar">
                    <IconButton onClick={onClose} size="small"><Close /></IconButton>
                </Tooltip>
            </div>

            <DialogContent className={classes.editorContent}>
                <textarea
                    ref={inputRef}
                    className={classes.editorField}
                    placeholder="Digite sua mensagem formatada aqui..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </DialogContent>
            
            <DialogActions style={{padding: '12px 16px', borderTop: `1px solid ${theme.palette.divider}`}}>
                <Typography className={classes.charCounter}>
                    {value.length} caracteres
                </Typography>
                <Button onClick={onClose} color="secondary" style={{textTransform: 'none'}}>Cancelar</Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => onSave(value)}
                    startIcon={<SendIcon style={{fontSize: 18}}/>}
                    style={{textTransform: 'none', borderRadius: 20, boxShadow: 'none'}}
                >
                    Enviar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const EmojiOptions = (props) => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowEmoji((prevState) => !prevState)}
        className={classes.sendMessageIcons}
      >
        <MoodIcon />
      </IconButton>
      {showEmoji ? (
        <ClickAwayListener onClickAway={() => setShowEmoji(false)}>
            <div className={classes.emojiBox}>
            <Picker
                perLine={16}
                showPreview={false}
                showSkinTones={false}
                onSelect={handleAddEmoji}
            />
            </div>
        </ClickAwayListener>
      ) : null}
    </>
  );
};

const SignSwitch = (props) => {
  const { width, setSignMessage, signMessage } = props;
  if (isWidthUp("md", width)) {
    return (
      <FormControlLabel
        style={{ marginRight: 7, color: "gray" }}
        label={i18n.t("messagesInput.signMessage")}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={signMessage}
            onChange={(e) => {
              setSignMessage(e.target.checked);
            }}
            name="showAllTickets"
            color="primary"
          />
        }
      />
    );
  }
  return null;
};

const FileInput = (props) => {
  const { handleChangeMedias, disableOption, setInputMessage } = props;
  const classes = useStyles();
  const [showOptions, setShowOptions] = useState(false);
  
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const handleOpenOptions = () => setShowOptions(!showOptions);

  const handleOptionClick = (type) => {
    setShowOptions(false);
    switch(type) {
      case 'image': fileInputRef.current.click(); break;
      case 'audio': audioInputRef.current.click(); break;
      case 'video': videoInputRef.current.click(); break;
      case 'document': documentInputRef.current.click(); break;
      case 'location': handleShareLocation(); break;
      default: break;
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const locationUrl = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        props.setInputMessage(prev => `${prev}\nMinha localização: ${locationUrl}`);
      }, (error) => {
        toastError("Erro ao obter localização: " + error.message);
      });
    } else {
      toastError("Geolocalização não suportada pelo navegador");
    }
  };

  return (
    <>
      <ClickAwayListener onClickAway={() => setShowOptions(false)}>
        <div style={{ position: 'relative' }}>
            <IconButton
            aria-label="upload"
            component="span"
            disabled={disableOption()}
            onClick={handleOpenOptions}
            className={classes.sendMessageIcons}
            >
            <AddIcon style={{transform: showOptions ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s"}} />
            </IconButton>
            
            {showOptions && (
            <Paper elevation={3} className={classes.attachmentMenu}>
                <MenuItem className={classes.attachmentMenuItem} onClick={() => handleOptionClick('image')}>
                <ListItemIcon><ImageIcon style={{color: blue[500]}} /></ListItemIcon>
                <ListItemText primary="Imagem" />
                </MenuItem>
                <MenuItem className={classes.attachmentMenuItem} onClick={() => handleOptionClick('video')}>
                <ListItemIcon><VideocamIcon style={{color: pink[500]}} /></ListItemIcon>
                <ListItemText primary="Vídeo" />
                </MenuItem>
                <MenuItem className={classes.attachmentMenuItem} onClick={() => handleOptionClick('document')}>
                <ListItemIcon><DescriptionIcon style={{color: orange[500]}} /></ListItemIcon>
                <ListItemText primary="Documento" />
                </MenuItem>
                <MenuItem className={classes.attachmentMenuItem} onClick={() => handleOptionClick('audio')}>
                <ListItemIcon><MicIcon style={{color: green[500]}} /></ListItemIcon>
                <ListItemText primary="Áudio" />
                </MenuItem>
                <MenuItem className={classes.attachmentMenuItem} onClick={() => handleOptionClick('location')}>
                <ListItemIcon><LocationOnIcon style={{color: purple[500]}} /></ListItemIcon>
                <ListItemText primary="Localização" />
                </MenuItem>
            </Paper>
            )}
        </div>
      </ClickAwayListener>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files && handleChangeMedias(e)} />
      <input type="file" ref={audioInputRef} accept="audio/*" style={{ display: 'none' }} onChange={(e) => e.target.files && handleChangeMedias(e)} />
      <input type="file" ref={videoInputRef} accept="video/*" style={{ display: 'none' }} onChange={(e) => e.target.files && handleChangeMedias(e)} />
      <input type="file" ref={documentInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && handleChangeMedias(e)} />
    </>
  );
};

const CustomInput = (props) => {
  const { loading, inputRef, ticketStatus, inputMessage, setInputMessage, handleSendMessage, handleInputPaste, disableOption } = props;
  const classes = useStyles();
  const [editorOpen, setEditorOpen] = useState(false);

  const onKeyPress = (e) => {
    if (loading || e.shiftKey) return;
    else if (e.key === "Enter") handleSendMessage();
  };

  const renderPlaceholder = () => {
    if (ticketStatus === "open") return i18n.t("messagesInput.placeholderOpen");
    return i18n.t("messagesInput.placeholderClosed");
  };

  return (
    <>
        <div className={classes.messageInputWrapper}>
        <InputBase
            inputRef={(input) => {
                if(input) {
                    if (document.activeElement !== input) {
                        input.focus();
                    }
                    inputRef.current = input;
                }
            }}
            placeholder={renderPlaceholder()}
            multiline
            className={classes.messageInput}
            inputProps={{ className: classes.inputBaseInput }}
            maxRows={5}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPaste={(e) => ticketStatus === "open" && handleInputPaste(e)}
            onKeyPress={onKeyPress}
            disabled={disableOption()}
        />
        {/* BOTÃO EXPANDIR COM ÍCONE CORRIGIDO */}
        <IconButton 
            size="small" 
            onClick={() => setEditorOpen(true)}
            disabled={disableOption()}
            className={classes.sendMessageIcons}
            style={{ padding: 6, marginBottom: 2 }} 
        >
            <OpenInFullIcon style={{ fontSize: 20 }} />
        </IconButton>
        </div>

        {/* COMPONENTE DE EDITOR AVANÇADO */}
        <TextEditorModal
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            initialValue={inputMessage}
            onSave={(newValue) => {
                setInputMessage(newValue);
                setEditorOpen(false);
                // Opcional: handleSendMessage(); se quiser enviar direto
            }}
        />
    </>
  );
};

const QuickMessages = ({ quickMessages, handleQuickMessageClick, inputMessage }) => {
    const classes = useStyles();
    const containerRef = useRef(null);

    const filteredQuickMessages = inputMessage.startsWith('/') 
        ? quickMessages.filter(msg => msg.shortcode.toLowerCase().includes(inputMessage.slice(1).toLowerCase()))
        : quickMessages;

    const handleScroll = (direction) => {
        if (!containerRef.current) return;
        const amount = 300;
        containerRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    if (filteredQuickMessages.length === 0) return null;

    return (
        <div className={classes.quickMessagesWrapper}>
            <IconButton size="small" className={`${classes.navButton} left`} onClick={() => handleScroll('left')}>
                <ChevronLeft />
            </IconButton>
            <div className={classes.quickMessagesContainer} ref={containerRef}>
                {filteredQuickMessages.map((message, index) => (
                    <Button 
                        key={index} 
                        variant="contained"
                        disableElevation
                        className={classes.quickMessageButton}
                        onClick={() => handleQuickMessageClick(message)}
                    >
                        {message.shortcode}
                    </Button>
                ))}
            </div>
            <IconButton size="small" className={`${classes.navButton} right`} onClick={() => handleScroll('right')}>
                <ChevronRight />
            </IconButton>
        </div>
    )
}

const ActionButtons = (props) => {
  const {
    inputMessage,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
    handleOpenModalForward, 
    showSelectMessageCheckbox 
  } = props;
  const classes = useStyles();
  
  if (inputMessage || showSelectMessageCheckbox) {
    return (
      <IconButton
        aria-label="sendMessage"
        component="span"
        onClick={showSelectMessageCheckbox ? handleOpenModalForward : handleSendMessage}
        disabled={loading}
        color="primary"
      >
        {showSelectMessageCheckbox ? (
          <Reply className={classes.ForwardMessageIcons} />
        ) : (
          <SendIcon className={classes.sendMessageIcons} />
        )}
      </IconButton>
    );
  } else if (recording) {
    return (
      <div className={classes.recorderWrapper}>
        <IconButton
          aria-label="cancelRecording"
          component="span"
          fontSize="large"
          disabled={loading}
          onClick={handleCancelAudio}
        >
          <HighlightOffIcon className={classes.cancelAudioIcon} />
        </IconButton>
        {loading ? (
          <div>
            <CircularProgress className={classes.audioLoading} />
          </div>
        ) : (
          <RecordingTimer />
        )}

        <IconButton
          aria-label="sendRecordedAudio"
          component="span"
          onClick={handleUploadAudio}
          disabled={loading}
        >
          <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
        </IconButton>
      </div>
    );
  } else {
    return (
      <IconButton
        aria-label="showRecorder"
        component="span"
        disabled={loading || ticketStatus !== "open"}
        onClick={handleStartRecording}
      >
        <MicIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  }
};

const MessageInputCustom = (props) => {
  const { ticketStatus, ticketId, width } = props;
  const classes = useStyles();
  const theme = useTheme();
  
  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [percentLoading, setPercentLoading] = useState(0);
  const inputRef = useRef();
  
  const { setReplyingMessage, replyingMessage } = useContext(ReplyMessageContext);
  const { user } = useContext(AuthContext);
  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);

  const { 
    selectedMessages, 
    setForwardMessageModalOpen, 
    forwardMessageModalOpen,
    showSelectMessageCheckbox,
    setShowSelectMessageCheckbox, 
    setSelectedMessages 
  } = useContext(ForwardMessageContext);
  
  const [quickMessages, setQuickMessages] = useState([]);
  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    inputRef.current.focus();
  }, [replyingMessage]);

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const messages = await listQuickMessages({ companyId, userId: user.id });
      setQuickMessages(messages);
    }
    fetchData();
  }, []);

  const handleChangeInput = (e) => {
    setInputMessage(e.target.value);
  };

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const handleChangeMedias = (selectedMedias) => {
    setMedias(selectedMedias);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      e.preventDefault(); 
      setMedias(Array.from(e.clipboardData.files));
    }
  };

  const handleOpenModalForward = () => {
    if (selectedMessages.length === 0) {
      toastError(i18n.t("messagesList.header.notMessage"));
      return;
    }
    setForwardMessageModalOpen(true);
  };

  const handleCloseModalForward = () => {
    setForwardMessageModalOpen(false);
    setShowSelectMessageCheckbox(false); 
    setSelectedMessages([]); 
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    if(e) e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);

    medias.forEach(async (media) => {
      if (media.type.split('/')[0] === 'image') {
        new Compressor(media, {
          quality: 0.7,
          success(result) {
            formData.append("medias", result, result.name);
            formData.append("body", result.name);
          },
          error(err) {
            console.log(err.message);
          },
        });
      } else {
        formData.append("medias", media);
        formData.append("body", media.name);
      }
    });

    setTimeout(async () => {
        try {
            await api.post(`/messages/${ticketId}`, formData, {
                onUploadProgress: (event) => {
                    let progress = Math.round((event.loaded * 100) / event.total);
                    setPercentLoading(progress);
                },
            });
            setMedias([]);
            setPercentLoading(0);
        } catch (err) {
            toastError(err);
        }
        setLoading(false);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    setLoading(true);
    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage ? `*${user?.name}:*\n${inputMessage.trim()}` : inputMessage.trim(),
      quotedMsg: replyingMessage,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
      setInputMessage("");
      setShowEmoji(false);
      setReplyingMessage(null);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
      setLoading(true);
      try {
        const [, blob] = await Mp3Recorder.stop().getMp3();
        if (blob.size < 10000) { setLoading(false); setRecording(false); return; }
        const formData = new FormData();
        const filename = `audio-record-${new Date().getTime()}.mp3`;
        formData.append("medias", blob, filename);
        formData.append("body", filename);
        formData.append("fromMe", true);
        await api.post(`/messages/${ticketId}`, formData);
      } catch(err) { toastError(err); }
      setRecording(false);
      setLoading(false);
  };

  const handleCancelAudio = async () => {
      try { await Mp3Recorder.stop().getMp3(); setRecording(false); } catch(err) {}
  };

  const handleQuickMessageClick = async (message) => {
    if (message.mediaPath) {
        setLoading(true);
        try {
            let url = message.mediaPath;
            if (!url.startsWith("http")) {
                url = `${process.env.REACT_APP_BACKEND_URL}/public/${message.mediaPath}`;
            }

            const response = await fetch(url);
            const blob = await response.blob();
            
            const formData = new FormData();
            const fileName = message.mediaName || message.mediaPath.split('/').pop();
            const fileExt = fileName.split('.').pop().toLowerCase();

            if (['mp3', 'ogg', 'wav'].includes(fileExt)) {
                const pttName = `audio-record-${new Date().getTime()}.mp3`;
                const file = new File([blob], pttName, { type: "audio/mp3" });
                formData.append("medias", file);
                formData.append("body", pttName); 
                formData.append("fromMe", true);
            } else {
                const file = new File([blob], fileName, { type: blob.type });
                formData.append("medias", file);
                formData.append("body", message.message || fileName);
                formData.append("fromMe", true);
            }

            await api.post(`/messages/${ticketId}`, formData);
        } catch(err) {
            toastError("Erro ao enviar mídia: " + err.message);
        }
        setLoading(false);
    } else {
        setInputMessage(message.message);
        setTimeout(() => {
            inputRef.current.focus();
        }, 100);
    }
  };

  const disableOption = () => loading || recording || ticketStatus !== "open";

  if (medias.length > 0) {
      return (
        <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
            <IconButton onClick={() => setMedias([])}>
                <CancelIcon className={classes.sendMessageIcons} />
            </IconButton>
            {loading ? <LinearWithValueLabel progress={percentLoading} /> : <Typography variant="body2">{medias[0]?.name}</Typography>}
            <IconButton onClick={handleUploadMedia} disabled={loading}>
                <SendIcon className={classes.sendMessageIcons} />
            </IconButton>
        </Paper>
      )
  }

  return (
    <Paper square elevation={0} className={classes.mainWrapper}>
      
      <ForwardMessageModal 
        modalOpen={forwardMessageModalOpen}
        onClose={handleCloseModalForward} 
        messages={selectedMessages}
      />

      {replyingMessage && (
        <div className={classes.replyginMsgWrapper}>
            <div className={classes.replyginMsgContainer}>
                <div className={classes.replyginMsgBody}>
                    <span className={classes.messageContactName}>
                        {replyingMessage.contact?.name}
                    </span>
                    {replyingMessage.body}
                </div>
            </div>
            <IconButton onClick={() => setReplyingMessage(null)}>
                <ClearIcon />
            </IconButton>
        </div>
      )}

      <QuickMessages 
        quickMessages={quickMessages} 
        handleQuickMessageClick={handleQuickMessageClick} 
        inputMessage={inputMessage} 
      />

      <div className={classes.newMessageBox}>
        <EmojiOptions
            disabled={disableOption()}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
        />

        <FileInput
            disableOption={disableOption}
            handleChangeMedias={handleChangeMedias}
            setMedias={setMedias}
            setInputMessage={setInputMessage}
        />

        <SignSwitch
            width={width}
            setSignMessage={setSignMessage}
            signMessage={signMessage}
        />

        {recording ? (
            <div className={classes.recorderWrapper}>
                <IconButton onClick={handleCancelAudio}>
                    <HighlightOffIcon className={classes.cancelAudioIcon} />
                </IconButton>
                <RecordingTimer />
                <IconButton onClick={handleUploadAudio}>
                    <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
                </IconButton>
            </div>
        ) : (
            <>
                <CustomInput
                    loading={loading}
                    inputRef={inputRef}
                    ticketStatus={ticketStatus}
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    handleSendMessage={handleSendMessage}
                    handleInputPaste={handleInputPaste}
                    disableOption={disableOption}
                />
                
                <ActionButtons
                    inputMessage={inputMessage}
                    loading={loading}
                    recording={recording}
                    ticketStatus={ticketStatus}
                    handleSendMessage={handleSendMessage}
                    handleCancelAudio={handleCancelAudio}
                    handleUploadAudio={handleUploadAudio}
                    handleStartRecording={handleStartRecording}
                    handleOpenModalForward={handleOpenModalForward}
                    showSelectMessageCheckbox={showSelectMessageCheckbox}
                />
            </>
        )}
      </div>
    </Paper>
  );
};

export default withWidth()(MessageInputCustom);