import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Avatar,
    Tabs,
    Tab,
    Paper,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Chip,
    Divider,
    IconButton,
    CircularProgress,
    Card,
    CardMedia,
    Tooltip,
} from "@material-ui/core";
import {
    Close,
    History,
    ConfirmationNumber,
    MonetizationOn,
    Schedule as ScheduleIcon,
    AttachFile,
    Assignment,
    WhatsApp,
    Email,
    Business,
    Description,
    Image as ImageIcon,
    Audiotrack,
    Movie,
    GetApp,
    Event,
    OpenInNew,
    ChatBubbleOutline,
    Warning,
    PictureAsPdf,
} from "@material-ui/icons";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from "@material-ui/lab";
import { format, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "../../services/api";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import toastError from "../../errors/toastError";
import TicketTaskModal from "../TicketTaskModal";
import ContactDealsList from "../ContactDealsList";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    headerProfile: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.default,
        borderRadius: theme.spacing(1),
        marginBottom: theme.spacing(2),
        border: "1px solid rgba(0, 0, 0, 0.12)",
    },
    avatar: {
        width: 100,
        height: 100,
        marginBottom: theme.spacing(1),
        fontSize: "2.5rem",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
    },
    tabPanel: {
        padding: theme.spacing(2),
        height: "550px",
        overflowY: "auto",
        backgroundColor: theme.palette.background.paper,
    },
    infoRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(1.5),
        color: theme.palette.text.secondary,
        "& svg": {
            marginRight: theme.spacing(1),
            fontSize: "1.2rem",
            color: theme.palette.primary.main,
        },
    },
    tagChip: {
        margin: "2px",
        fontSize: "0.7rem",
        height: "22px",
        fontWeight: 600,
    },
    ticketCard: {
        marginBottom: theme.spacing(2),
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(2),
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        position: "relative",
        transition: "0.3s",
        "&:hover": {
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        },
    },
    ticketHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: theme.spacing(1),
    },
    ticketStatusOpen: {
        backgroundColor: "#4caf50",
        color: "#fff",
        borderRadius: 16,
        padding: "2px 10px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        marginLeft: 8,
        textTransform: "uppercase",
    },
    ticketStatusClosed: {
        backgroundColor: "#9e9e9e",
        color: "#fff",
        borderRadius: 16,
        padding: "2px 10px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        marginLeft: 8,
        textTransform: "uppercase",
    },
    ticketIcon: {
        color: "#1976d2",
        marginRight: 10,
        fontSize: 24,
    },
    lastMessageContainer: {
        backgroundColor: theme.palette.campaigntab,
        borderRadius: 8,
        padding: theme.spacing(1.5),
        marginTop: theme.spacing(2),
        border: "1px solid #eeeeee",
    },
    lastMessageLabel: {
        fontSize: "0.75rem",
        fontWeight: "bold",
        color: theme.palette.textPrimary,
        display: "flex",
        alignItems: "center",
        marginBottom: 4,
    },
    msgBadge: {
        backgroundColor: "#e0e0e0",
        color: "#444",
        borderRadius: 4,
        padding: "1px 6px",
        fontSize: "0.65rem",
        marginLeft: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    alertBox: {
        border: "2px dashed #fbc02d",
        backgroundColor: "#fffde7",
        padding: theme.spacing(2),
        borderRadius: 8,
        marginTop: theme.spacing(2),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },
    mediaCard: {
        display: "flex",
        marginBottom: theme.spacing(1),
        alignItems: "center",
        padding: theme.spacing(1),
        height: "100%",
    },
    mediaCover: {
        width: 60,
        height: 60,
        borderRadius: 4,
        marginRight: theme.spacing(1),
        backgroundSize: "cover",
        backgroundPosition: "center",
    },
}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    const classes = useStyles();

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`contact-management-tabpanel-${index}`}
            aria-labelledby={`contact-management-tab-${index}`}
            {...other}
        >
            {value === index && <Box className={classes.tabPanel}>{children}</Box>}
        </div>
    );
}

const ContactManagementModal = ({ open, onClose, contactId }) => {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const [contact, setContact] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    // Dados
    const [tickets, setTickets] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Tarefas e Modal
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Reset Completo ao abrir modal ou trocar ID
    useEffect(() => {
        if (open && contactId) {
            setContact(null);
            setTickets([]);
            setSchedules([]);
            setFiles([]);
            setTabValue(0);

            fetchContactData();
            fetchSchedules();
        }
    }, [open, contactId]);

    // Carrega Arquivos apenas quando a aba é selecionada
    useEffect(() => {
        if (open && contactId && tabValue === 5) {
            fetchFiles();
        }
    }, [tabValue, open, contactId]);

    const fetchContactData = async () => {
        try {
            const { data } = await api.get(`/contacts/${contactId}`);
            setContact(data);
            setTickets(data.tickets || []);
        } catch (err) {
            toastError(err);
        }
    };

    const fetchSchedules = async () => {
        try {
            const { data } = await api.get(`/schedules`, { params: { contactId } });
            setSchedules(data.schedules);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchFiles = async () => {
        setLoadingFiles(true);
        try {
            const { data } = await api.get(`/contacts/${contactId}/media`);
            setFiles(data.messages);
        } catch (err) {
            console.error("Erro ao carregar arquivos:", err);
        }
        setLoadingFiles(false);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOpenTicket = (uuid) => {
        if (uuid) {
            onClose();
            history.push(`/tickets/${uuid}`);
        } else {
            console.error("UUID do ticket não encontrado. Verifique o backend ShowContactService.");
        }
    };

    const handleOpenTaskModal = (ticket) => {
        if (ticket) {
            setSelectedTicketId(ticket.id);
            setTaskModalOpen(true);
        } else {
            if (tickets.length > 0) {
                setSelectedTicketId(tickets[0].id);
                setTaskModalOpen(true);
            } else {
                alert("Não há tickets vinculados para criar uma tarefa.");
            }
        }
    };

    const renderFileIcon = (mediaType) => {
        if (mediaType.includes("image")) return <ImageIcon style={{ color: "#9c27b0" }} />;
        if (mediaType.includes("audio")) return <Audiotrack style={{ color: "#4caf50" }} />;
        if (mediaType.includes("video")) return <Movie style={{ color: "#f44336" }} />;
        if (mediaType.includes("pdf")) return <PictureAsPdf style={{ color: "#f44336" }} />;
        return <Description style={{ color: "#2196f3" }} />;
    };

    const hasAlerts = () => {
        const overdueSchedules = schedules.filter(
            (s) => s.status === "PENDING" && isBefore(parseISO(s.sendAt), new Date())
        );
        return overdueSchedules.length > 0;
    };

    if (!contact) return null;

    const displayTags =
        tickets.length > 0 && tickets[0].tags && tickets[0].tags.length > 0 ? tickets[0].tags : contact.tags;

    const activeTicket = tickets.find((t) => t.status === "open" && t.user) || tickets.find((t) => t.user);
    const responsibleName = activeTicket?.user?.name;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <TicketTaskModal
                modalOpen={taskModalOpen}
                ticketId={selectedTicketId}
                onClose={() => setTaskModalOpen(false)}
            />

            <DialogTitle>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">Gestão 360º - {contact.name}</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </div>
            </DialogTitle>
            <DialogContent dividers style={{ backgroundColor: theme.palette.KanbanBackground }}>
                <Grid container spacing={3}>
                    {/* === SIDEBAR (ESQUERDA) === */}
                    <Grid item xs={12} md={3}>
                        <Paper className={classes.headerProfile} elevation={0}>
                            <Avatar
                                src={contact.profilePicUrl}
                                className={classes.avatar}
                                style={{ backgroundColor: generateColor(contact.number) }}
                            >
                                {getInitials(contact.name)}
                            </Avatar>
                            <Typography variant="h6" align="center" style={{ fontWeight: 600 }}>
                                {contact.name}
                            </Typography>
                            {contact.secondaryNumber && (
                                <Chip
                                    label="Multinúmero"
                                    size="small"
                                    style={{ backgroundColor: "#e0f2f1", color: "#00695c", marginTop: 5 }}
                                />
                            )}

                            <div style={{ width: "100%", marginTop: 20 }}>
                                <div className={classes.infoRow}>
                                    <WhatsApp /> <Typography variant="body2">{contact.number}</Typography>
                                </div>
                                <div className={classes.infoRow}>
                                    <Email /> <Typography variant="body2">{contact.email || "-"}</Typography>
                                </div>

                                {responsibleName && (
                                    <div className={classes.infoRow}>
                                        <Business />
                                        <Typography variant="body2">Resp: {responsibleName}</Typography>
                                    </div>
                                )}
                            </div>

                            <Divider style={{ width: "100%", margin: "10px 0" }} />

                            <Typography variant="subtitle2" gutterBottom style={{ fontWeight: "bold" }}>
                                Segmentação
                            </Typography>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {displayTags && displayTags.length > 0 ? (
                                    displayTags.map((tag) => (
                                        <Chip
                                            key={tag.id}
                                            label={tag.name}
                                            style={{ backgroundColor: tag.color, color: "#fff" }}
                                            className={classes.tagChip}
                                            size="small"
                                        />
                                    ))
                                ) : (
                                    <Typography variant="caption" color="textSecondary">
                                        Sem etiquetas
                                    </Typography>
                                )}
                            </div>
                        </Paper>

                        {/* === ALERTA === */}
                        {hasAlerts() && (
                            <Box className={classes.alertBox}>
                                <Warning style={{ fontSize: 40, color: "#fbc02d", marginBottom: 10 }} />
                                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#f57f17" }}>
                                    Atenção Necessária!
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Existem agendamentos atrasados para este contato.
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* === CONTEÚDO PRINCIPAL (DIREITA) === */}
                    <Grid item xs={12} md={9}>
                        <Paper square variant="outlined" elevation={0}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                indicatorColor="primary"
                                textColor="primary"
                            >
                                <Tab icon={<ConfirmationNumber />} label={`Tickets (${tickets.length})`} />
                                <Tab icon={<History />} label="Linha do Tempo" />
                                <Tab icon={<ScheduleIcon />} label={`Agendamentos (${schedules.length})`} />
                                <Tab icon={<Assignment />} label="Tarefas" />
                                <Tab icon={<MonetizationOn />} label="Oportunidades" />
                                <Tab icon={<AttachFile />} label="Arquivos (GED)" />
                            </Tabs>
                        </Paper>

                        {/* ABA 0: TICKETS */}
                        <TabPanel value={tabValue} index={0}>
                            {tickets.length > 0 ? (
                                tickets.map((ticket) => (
                                    <div key={ticket.id} className={classes.ticketCard}>
                                        <div className={classes.ticketHeader}>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <ConfirmationNumber className={classes.ticketIcon} />
                                                <div>
                                                    <Typography
                                                        variant="subtitle1"
                                                        style={{ fontWeight: 700, lineHeight: 1 }}
                                                    >
                                                        Ticket #{ticket.id}
                                                        <span
                                                            className={
                                                                ticket.status === "open"
                                                                    ? classes.ticketStatusOpen
                                                                    : classes.ticketStatusClosed
                                                            }
                                                        >
                                                            {ticket.status === "open" ? "Aberto" : "Fechado"}
                                                        </span>
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Atendente: {ticket.user?.name || "Sem atendente"} | Fila:{" "}
                                                        {ticket.queue?.name || "Sem fila"}
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="caption" color="textSecondary">
                                                        Criado: {format(parseISO(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                                                    </Typography>
                                                </div>
                                            </div>
                                            <div>
                                                <Tooltip title="Adicionar Tarefa">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenTaskModal(ticket)}
                                                    >
                                                        <Assignment />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Abrir Conversa">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenTicket(ticket.uuid)}
                                                    >
                                                        <OpenInNew />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className={classes.lastMessageContainer}>
                                            <div className={classes.lastMessageLabel}>
                                                <ChatBubbleOutline fontSize="inherit" style={{ marginRight: 4 }} />
                                                Última Mensagem
                                                <span className={classes.msgBadge}>Recebida</span>
                                            </div>
                                            <Typography variant="body2" style={{ fontStyle: "italic", color: theme.palette.options }}>
                                                {ticket.lastMessage || "Nenhuma mensagem registrada."}
                                            </Typography>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <Typography variant="body1" align="center" style={{ marginTop: 50, color: "#999" }}>
                                    Nenhum ticket encontrado.
                                </Typography>
                            )}
                        </TabPanel>

                        {/* ABA 1: LINHA DO TEMPO */}
                        <TabPanel value={tabValue} index={1}>
                            <Timeline align="alternate">
                                {tickets.length > 0 ? (
                                    tickets.map((ticket) => (
                                        <TimelineItem key={ticket.id}>
                                            <TimelineOppositeContent>
                                                <Typography color="textSecondary" variant="caption">
                                                    {format(parseISO(ticket.updatedAt), "dd/MM/yy HH:mm", {
                                                        locale: ptBR,
                                                    })}
                                                </Typography>
                                            </TimelineOppositeContent>
                                            <TimelineSeparator>
                                                <TimelineDot color={ticket.status === "open" ? "primary" : "grey"}>
                                                    <WhatsApp fontSize="small" />
                                                </TimelineDot>
                                                <TimelineConnector />
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Paper elevation={1} style={{ padding: "8px 12px" }}>
                                                    <Typography variant="body2" style={{ fontWeight: "bold" }}>
                                                        Ticket #{ticket.id}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {ticket.lastMessage?.substring(0, 30)}...
                                                    </Typography>
                                                </Paper>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))
                                ) : (
                                    <Typography align="center" color="textSecondary">
                                        Histórico vazio.
                                    </Typography>
                                )}
                            </Timeline>
                        </TabPanel>

                        {/* ABA 2: AGENDAMENTOS */}
                        <TabPanel value={tabValue} index={2}>
                            {schedules.length > 0 ? (
                                <List>
                                    {schedules.map((schedule) => (
                                        <React.Fragment key={schedule.id}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <Event color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={schedule.body}
                                                    secondary={
                                                        <span
                                                            style={{
                                                                color: isBefore(parseISO(schedule.sendAt), new Date())
                                                                    ? "red"
                                                                    : "inherit",
                                                            }}
                                                        >
                                                            {format(parseISO(schedule.sendAt), "dd/MM/yyyy HH:mm")}
                                                        </span>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Chip
                                                        label={schedule.status}
                                                        color={schedule.status === "PENDING" ? "primary" : "default"}
                                                        size="small"
                                                    />
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    height="100%"
                                >
                                    <Event style={{ fontSize: 50, color: "#e0e0e0" }} />
                                    <Typography color="textSecondary">Sem agendamentos.</Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* ABA 3: TAREFAS */}
                        <TabPanel value={tabValue} index={3}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                height="100%"
                            >
                                <Assignment style={{ fontSize: 50, color: "#e0e0e0" }} />
                                <Typography color="textSecondary" style={{ marginTop: 10 }}>
                                    Gerencie tarefas vinculadas aos tickets.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    style={{ marginTop: 20 }}
                                    onClick={() => handleOpenTaskModal(null)}
                                >
                                    Adicionar Nova Tarefa
                                </Button>
                            </Box>
                        </TabPanel>

                        {/* ABA 4: OPORTUNIDADES */}
                        <TabPanel value={tabValue} index={4}>
                            <ContactDealsList contactId={contactId} />
                        </TabPanel>

                        {/* ABA 5: ARQUIVOS (GED) */}
                        <TabPanel value={tabValue} index={5}>
                            {loadingFiles ? (
                                <Box display="flex" justifyContent="center" padding={4}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {files.length > 0 ? (
                                        files.map((file) => (
                                            <Grid item xs={12} sm={6} md={4} key={file.id}>
                                                <Card className={classes.mediaCard} variant="outlined">
                                                    {file.mediaType.includes("image") ? (
                                                        <CardMedia
                                                            className={classes.mediaCover}
                                                            image={file.mediaUrl}
                                                            title="Imagem"
                                                        />
                                                    ) : (
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            className={classes.mediaCover}
                                                            bgcolor="#eee"
                                                        >
                                                            {renderFileIcon(file.mediaType)}
                                                        </Box>
                                                    )}
                                                    <div style={{ flex: 1, overflow: "hidden", paddingLeft: 8 }}>
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            title={file.body || "Arquivo"}
                                                        >
                                                            {file.body || file.mediaUrl.split("/").pop()}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {format(parseISO(file.createdAt), "dd/MM/yyyy HH:mm")}
                                                        </Typography>
                                                    </div>
                                                    <IconButton href={file.mediaUrl} target="_blank" color="primary">
                                                        <GetApp />
                                                    </IconButton>
                                                </Card>
                                            </Grid>
                                        ))
                                    ) : (
                                        <Grid item xs={12}>
                                            <Box
                                                display="flex"
                                                flexDirection="column"
                                                alignItems="center"
                                                justifyContent="center"
                                                height="200px"
                                            >
                                                <AttachFile style={{ fontSize: 50, color: "#e0e0e0" }} />
                                                <Typography color="textSecondary">
                                                    Nenhum arquivo encontrado.
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                        </TabPanel>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContactManagementModal;
