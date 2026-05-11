import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Typography,
    Grid,
    Paper,
    Tabs,
    Tab,
    IconButton,
    CircularProgress,
    makeStyles,
    Modal,
    Backdrop,
    Fade,
    Tooltip,
} from "@material-ui/core";
import {
    Close,
    Image as ImageIcon,
    Description,
    GetApp,
    Movie,
    Audiotrack,
    PictureAsPdf,
    InsertDriveFile,
    GridOn, // Excel
    Subject, // Txt/Doc
    MyLocation,
    OpenInNew,
} from "@material-ui/icons";
import { format } from "date-fns";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        overflow: "hidden",
    },
    dialogContent: {
        padding: theme.spacing(1),
        height: "70vh",
        display: "flex",
        flexDirection: "column",
    },
    mediaItem: {
        position: "relative",
        height: 120,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.background.default,
        cursor: "pointer",
        "&:hover": {
            "& $hoverOverlay": {
                display: "flex",
            },
        },
    },
    mediaImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    fileIcon: {
        fontSize: 48,
        color: theme.palette.primary.main,
    },
    fileName: {
        fontSize: 11,
        padding: "4px",
        textAlign: "center",
        wordBreak: "break-all",
        maxHeight: 30,
        overflow: "hidden",
        lineHeight: "1.2em",
    },
    hoverOverlay: {
        display: "none",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "#fff",
        transition: "all 0.3s",
        zIndex: 2,
    },
    actionButton: {
        color: "#fff",
        backgroundColor: "rgba(255,255,255,0.2)",
        "&:hover": {
            backgroundColor: "rgba(255,255,255,0.4)",
        },
    },
    dateBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: 10,
        padding: "2px 6px",
        borderTopLeftRadius: 4,
        zIndex: 3,
    },
    loadMoreBtn: {
        marginTop: theme.spacing(2),
        width: "100%",
    },
    // --- ESTILOS DO VISUALIZADOR ---
    viewerModal: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    viewerContainer: {
        outline: "none",
        maxWidth: "90vw",
        maxHeight: "90vh",
        position: "relative",
        backgroundColor: "transparent",
    },
    viewerMedia: {
        maxWidth: "100%",
        maxHeight: "85vh",
        borderRadius: 4,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    },
    closeViewerBtn: {
        position: "absolute",
        top: -40,
        right: 0,
        color: "#fff",
        backgroundColor: "rgba(0,0,0,0.5)",
        "&:hover": {
            backgroundColor: "rgba(0,0,0,0.8)",
        },
    },
}));

const TicketGedModal = ({ open, onClose, ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const [medias, setMedias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [tab, setTab] = useState("all");

    // Estados do Visualizador
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);

    useEffect(() => {
        if (open && ticket) {
            setPageNumber(1);
            setMedias([]);
            fetchMedias(1);
        }
    }, [open, ticket]);

    const fetchMedias = async (page) => {
        if (!ticket) return;
        try {
            setLoading(true);
            const { data } = await api.get(`/contacts/${ticket.contactId}/media`, {
                params: {
                    pageNumber: page,
                },
            });

            setMedias((prev) => (page === 1 ? data.messages : [...prev, ...data.messages]));
            setHasMore(data.hasMore);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    const loadMore = () => {
        const nextPage = pageNumber + 1;
        setPageNumber(nextPage);
        fetchMedias(nextPage);
    };

    // --- LÓGICA DE ÍCONES POR EXTENSÃO ---
    const getFileIcon = (fileName) => {
        const ext = fileName.split(".").pop().toLowerCase();

        if (ext === "pdf") {
            return <PictureAsPdf style={{ fontSize: 48, color: "#F44336" }} />;
        }
        if (["doc", "docx"].includes(ext)) {
            return <Description style={{ fontSize: 48, color: "#2196F3" }} />;
        }
        if (["xls", "xlsx", "csv"].includes(ext)) {
            return <GridOn style={{ fontSize: 48, color: "#4CAF50" }} />;
        }
        if (["txt"].includes(ext)) {
            return <Subject style={{ fontSize: 48, color: "#607D8B" }} />;
        }

        return <InsertDriveFile style={{ fontSize: 48, color: "#757575" }} />;
    };

    const getMediaUrl = (media) => {
        return media.mediaUrl.startsWith("http")
            ? media.mediaUrl
            : `${process.env.REACT_APP_BACKEND_URL}/public/${media.mediaUrl}`;
    };

    const handleOpenMedia = (media) => {
        if (media.mediaType.includes("image") || media.mediaType.includes("video")) {
            setSelectedMedia(media);
            setViewerOpen(true);
        } else {
            // Documentos e Áudios abrem em nova aba
            const url = getMediaUrl(media);
            window.open(url, "_blank");
        }
    };

    // --- CORREÇÃO: NAVEGAÇÃO IGUAL À BUSCA AVANÇADA ---
    const handleLocateMessage = (messageId) => {
        onClose(); // Fecha o modal
        const ticketUuid = ticket.uuid;

        if (ticketUuid) {
            // Usa query param ?messageId= que é o padrão do sistema
            history.push(`/tickets/${ticketUuid}?messageId=${messageId}`);
        }
    };

    const handleDownload = (media) => {
        const url = getMediaUrl(media);
        const link = document.createElement("a");
        link.href = url;
        link.download = media.body;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredMedias = medias.filter((m) => {
        const isImgVid = m.mediaType.includes("image") || m.mediaType.includes("video");
        const isAudio = m.mediaType.includes("audio");

        if (tab === "all") return true;
        if (tab === "image") return isImgVid;
        if (tab === "audio") return isAudio;
        if (tab === "document") return !isImgVid && !isAudio;
        return true;
    });

    const renderMediaItem = (message) => {
        const isImage = message.mediaType.includes("image");
        const isVideo = message.mediaType.includes("video");
        const isAudio = message.mediaType.includes("audio");
        const url = getMediaUrl(message);

        return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={message.id}>
                <div className={classes.mediaItem}>
                    {/* CONTEÚDO VISUAL DO ITEM */}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        onClick={() => handleOpenMedia(message)}
                    >
                        {isImage ? (
                            <img src={url} alt={message.body} className={classes.mediaImage} />
                        ) : isVideo ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <Movie style={{ fontSize: 48, color: "#E91E63" }} />
                                <Typography variant="caption" className={classes.fileName}>
                                    Vídeo
                                </Typography>
                            </div>
                        ) : isAudio ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <Audiotrack style={{ fontSize: 48, color: "#FF9800" }} />
                                <Typography variant="caption" className={classes.fileName}>
                                    Áudio
                                </Typography>
                            </div>
                        ) : (
                            // LÓGICA DE DOCUMENTOS (ICONES)
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 4 }}>
                                {getFileIcon(message.body)}
                                <Typography variant="caption" className={classes.fileName}>
                                    {message.body.length > 25 ? message.body.substring(0, 20) + "..." : message.body}
                                </Typography>
                            </div>
                        )}
                    </div>

                    {/* OVERLAY DE AÇÕES (HOVER) */}
                    <div className={classes.hoverOverlay}>
                        {/* Botão 1: Visualizar/Baixar */}
                        <Tooltip title={isImage || isVideo ? "Visualizar" : "Abrir em nova guia"}>
                            <IconButton
                                className={classes.actionButton}
                                size="small"
                                onClick={() => handleOpenMedia(message)}
                            >
                                {isImage || isVideo ? <ImageIcon /> : <OpenInNew />}
                            </IconButton>
                        </Tooltip>

                        {/* BOTÃO MÁGICO: IR PARA MENSAGEM */}
                        <Tooltip title="Localizar na conversa">
                            <IconButton
                                className={classes.actionButton}
                                size="small"
                                onClick={() => handleLocateMessage(message.id)}
                            >
                                <MyLocation />
                            </IconButton>
                        </Tooltip>

                        {/* Botão 3: Download */}
                        <Tooltip title="Baixar">
                            <IconButton
                                className={classes.actionButton}
                                size="small"
                                onClick={() => handleDownload(message)}
                            >
                                <GetApp />
                            </IconButton>
                        </Tooltip>
                    </div>

                    <div className={classes.dateBadge}>{format(new Date(message.createdAt), "dd/MM/yy")}</div>
                </div>
            </Grid>
        );
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="h6">Arquivos do Ticket (GED)</Typography>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </div>
                </DialogTitle>

                <Paper square>
                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                    >
                        <Tab value="all" label="Todos" />
                        <Tab value="image" label="Fotos/Vídeos" />
                        <Tab value="audio" label="Áudios" />
                        <Tab value="document" label="Documentos" />
                    </Tabs>
                </Paper>

                <DialogContent className={classes.dialogContent} dividers>
                    <Grid container spacing={2}>
                        {filteredMedias.length > 0 ? (
                            filteredMedias.map((media) => renderMediaItem(media))
                        ) : (
                            <div
                                style={{
                                    padding: 20,
                                    width: "100%",
                                    textAlign: "center",
                                    color: "#999",
                                    marginTop: 20,
                                }}
                            >
                                {!loading && "Nenhum arquivo encontrado nesta categoria."}
                            </div>
                        )}
                    </Grid>

                    {loading && (
                        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                            <CircularProgress size={24} />
                        </div>
                    )}

                    {hasMore && !loading && (
                        <Button onClick={loadMore} className={classes.loadMoreBtn} variant="outlined" color="primary">
                            Carregar Mais
                        </Button>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- MODAL VISUALIZADOR DE MÍDIA --- */}
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                className={classes.viewerModal}
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={viewerOpen}>
                    <div className={classes.viewerContainer}>
                        <IconButton className={classes.closeViewerBtn} onClick={() => setViewerOpen(false)}>
                            <Close />
                        </IconButton>

                        {selectedMedia &&
                            (selectedMedia.mediaType.includes("video") ? (
                                <video
                                    controls
                                    className={classes.viewerMedia}
                                    src={getMediaUrl(selectedMedia)}
                                    autoPlay
                                >
                                    Seu navegador não suporta a tag de vídeo.
                                </video>
                            ) : (
                                <img
                                    src={getMediaUrl(selectedMedia)}
                                    alt={selectedMedia.body}
                                    className={classes.viewerMedia}
                                />
                            ))}
                    </div>
                </Fade>
            </Modal>
        </>
    );
};

export default TicketGedModal;
