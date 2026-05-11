import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from "react-trello";
import { toast } from "react-toastify";
import KanbanKPIs from "../../components/KanbanKPIs";
import KanbanFilters from "../../components/KanbanFilters";
import NewDealModal from "../../components/NewDealModal";
import LaneTitle from "../../components/Kanban/LaneTitle";
import CardTitle from "../../components/Kanban/CardTitle";
import FooterButtons from "../../components/Kanban/FooterButtons";
import {
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Typography,
    Select,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Grid,
    Tooltip,
    useMediaQuery,
    useTheme,
    Paper,
    Badge,
    Fab,
    CircularProgress,
} from "@material-ui/core";
import {
    MoreVert,
    Archive,
    Add as AddIcon,
    Search,
    Visibility,
    VisibilityOff,
    DateRange,
    AttachMoney,
    Settings,
    Refresh,
    Assessment,
    TrendingUp,
    ThumbDown,
    MonetizationOn,
    FilterList,
    Save,
    InfoOutlined,
    ArrowUpward,
    ArrowDownward,
    Palette,
    Close,
} from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import Autocomplete from "@material-ui/lab/Autocomplete";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        padding: "30px",
        height: "100vh",
        backgroundColor: theme.palette.background.default,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        [theme.breakpoints.down("sm")]: {
            padding: "10px",
            height: "calc(100vh - 56px)", // Ajuste para navbar mobile se houver
        },
    },
    // Adicionado container de loading para evitar renderização quebrada
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: theme.palette.background.default,
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexShrink: 0,
        [theme.breakpoints.down("sm")]: {
            marginBottom: "10px",
        },
    },
    pageTitle: {
        fontWeight: "800",
        color: theme.palette.text.primary,
        fontSize: "1.6rem",
        [theme.breakpoints.down("sm")]: {
            fontSize: "1.2rem",
        },
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    iconBtn: {
        color: theme.palette.text.secondary,
        "&:hover": { color: theme.palette.primary.main },
    },
    settingsDialogContent: {
        backgroundColor: theme.palette.fancyBackground,
    },
    // KPIs Responsivos
    kpiContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "15px",
        height: "auto",
        marginBottom: "20px",
        flexShrink: 0,
        [theme.breakpoints.down("sm")]: {
            display: "grid", // Mudamos de flex para grid
            // Usa 2 colunas (1fr 1fr) para caber bem na tela do celular
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            paddingBottom: "5px",
            marginBottom: "10px",
            // Removemos as propriedades de scroll horizontal
            overflowX: "hidden",
            scrollSnapType: "none",
            "& > div": {
                minWidth: "100px", // Permite que o card encolha para caber na coluna
                width: "100%", // Ocupa toda a largura da célula do grid
                height: "80px", // Mantém altura consistente
                padding: "10px",
            },
        },
    },
    kpiCard: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        padding: "0.938rem",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
        border: `1px solid ${theme.palette.divider}`,
        height: "80px",
        // Ajuste interno para garantir que o conteúdo não quebre no mobile
        [theme.breakpoints.down("sm")]: {
            padding: "8px", // Reduz padding interno no mobile
            height: "60px", // Altura um pouco menor no mobile
        },
    },
    kpiIconBox: {
        width: "45px",
        height: "45px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "15px",
        flexShrink: 0,
        [theme.breakpoints.down("sm")]: {
            width: "35px",
            height: "35px",
            marginRight: "10px",
            "& svg": { fontSize: "1.2rem" },
        },
    },
    kpiContent: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
    },
    kpiLabel: {
        fontSize: "0.75rem",
        color: theme.palette.text.secondary,
        fontWeight: "500",
        whiteSpace: "nowrap",
        [theme.breakpoints.down("sm")]: { fontSize: "0.625rem" },
    },
    kpiValue: {
        fontSize: "1.125rem",
        fontWeight: "800",
        color: theme.palette.text.primary,
        lineHeight: "1.2",
        [theme.breakpoints.down("sm")]: { fontSize: "0.875rem" },
    },
    kpiSub: {
        fontSize: "0.625rem",
        color: "#9CA3AF",
        marginTop: "2px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    filterActionsContainer: {
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        marginBottom: "10px",
        flexShrink: 0,
        [theme.breakpoints.down("sm")]: {
            flexDirection: "column",
        },
    },
    filterContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        flexGrow: 1,
        [theme.breakpoints.down("sm")]: {
            display: "none", // Esconde no mobile (vai pro modal)
        },
    },
    searchWrapper: {
        flexGrow: 1,
        minWidth: "200px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        padding: "0 15px",
        height: "42px",
        "&:focus-within": {
            borderColor: theme.palette.primary.main,
        },
    },
    searchInput: {
        border: "none",
        background: "transparent",
        outline: "none",
        width: "100%",
        marginLeft: "10px",
        fontSize: "14px",
        color: theme.palette.text.primary,
    },
    filterSelect: {
        minWidth: "140px",
        backgroundColor: theme.palette.background.paper,
        "& .MuiOutlinedInput-root": {
            height: "42px",
            borderRadius: "8px",
        },
    },
    // Mobile Tabs
    mobileTabsContainer: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        marginBottom: "10px",
        border: `1px solid ${theme.palette.divider}`,
        minHeight: "48px",
        "& .MuiTabs-flexContainer": {
            justifyContent: "flex-start",
        },
    },
    mobileTab: {
        textTransform: "none",
        minWidth: "auto",
        fontWeight: 600,
        fontSize: "0.813rem",
        padding: "6px 12px",
        [theme.breakpoints.down("xs")]: {
            fontSize: "0.75rem",
            padding: "6px 8px",
        },
    },
    // Mobile List View (Accordion Style)
    mobileCardList: {
        flexGrow: 1,
        overflowY: "auto",
        paddingBottom: "80px", // Espaço para FAB
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    mobileCardItem: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        padding: "10px",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    boardWrapper: {
        position: "relative",
        flexGrow: 1,
        width: "100%",
        height: "100%",
        overflowY: "hidden",
        [theme.breakpoints.down("sm")]: {
            display: "none", // Esconde React-Trello no mobile
        },
        "& .react-trello-board": {
            background: "transparent",
            height: "100%",
            width: "100%",
            padding: "0",
            whiteSpace: "nowrap",
            overflowX: "auto",
        },
        "& .react-trello-lane": {
            display: "inline-flex !important",
            flexDirection: "column",
            height: "calc(100vh - 350px) !important",
            maxHeight: "calc(100vh - 350px) !important",
            width: "320px !important",
            minWidth: "320px !important",
            backgroundColor:
                theme.palette.laneKanbanBackground || (theme.palette.mode === "dark" ? "#262626" : "#EBECF0"),
            borderRadius: "12px",
            marginRight: "5px",
            verticalAlign: "top",
            whiteSpace: "normal",
            padding: "0 10px 10px 10px",
            flexShrink: 0,
        },
        "& .react-trello-lane > div": {
            width: "100% !important",
        },
        "& .react-trello-lane-header": {
            cursor: "grab",
            padding: "10px 4px",
            marginBottom: "5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "40px",
            width: "100% !important",
            flexShrink: 0,
        },
        "& .smooth-dnd-container.vertical": {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            width: "100% !important",
            minWidth: "100% !important",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "6px",
            gap: "10px",
            minHeight: "0",
        },
        "& .lane-settings": {
            display: "flex !important",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.text.secondary,
            fontSize: "1.25rem",
            marginTop: "-5px",
            cursor: "pointer",
            "&:hover": { color: theme.palette.primary.main },
        },
        "& ::-webkit-scrollbar": { width: "6px", height: "6px" },
        "& ::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: "3px" },
        "& ::-webkit-scrollbar-track": { background: "transparent" },
        "& .react-trello-card": {
            width: "100% !important",
            maxWidth: "100% !important",
            marginBottom: "0",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
            borderRadius: "8px",
            backgroundColor: theme.palette.background.paper,
            position: "relative",
            transition: "all 0.2s",
            boxShadow: theme.palette.mode === "dark" ? "0 1px 2px rgba(0,0,0,0.5)" : "0 1px 2px rgba(0,0,0,0.08)",
            "&:hover": {
                backgroundColor: `${theme.palette.background.paper} !important`,
                borderColor: theme.palette.primary.main,
                boxShadow: theme.palette.mode === "dark" ? "0 4px 10px rgba(0,0,0,0.6)" : "0 4px 10px rgba(0,0,0,0.15)",
            },
            "& header": {
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                paddingBottom: "0px !important",
                marginBottom: "8px !important",
            },
            "& header > span:first-child": {
                flex: 1,
                width: "0",
                paddingRight: "8px",
            },
            "& header > span:last-child": {
                width: "auto",
                flexShrink: 0,
            },
        },
    },
    modalPaper: {
        borderRadius: "16px",
        padding: "10px",
        [theme.breakpoints.down("sm")]: {
            margin: "10px",
            width: "calc(100% - 20px)",
            maxHeight: "calc(100% - 20px)",
        },
    },
    tabHeader: {
        borderBottom: "1px solid #e0e0e0",
        marginBottom: "20px",
    },
    loadMoreBtn: {
        marginTop: 10,
        width: "100%",
        border: `1px dashed ${theme.palette.text.secondary}`,
        color: theme.palette.text.secondary,
        borderRadius: 8,
        "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
        },
    },
    // FABs
    fabFilter: {
        position: "fixed",
        bottom: "80px",
        right: "20px",
        zIndex: 1000,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
    },
    fabAdd: {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
    },
    mobileFilterContent: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        padding: "20px",
    },
}));

const currencyMask = (value) => {
    if (!value) return "";
    let v = value.replace(/\D/g, "");
    v = (v / 100).toFixed(2) + "";
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v;
};

// Componente Cartão KPI

const Kanban = () => {
    const classes = useStyles();
    const { user } = useContext(AuthContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const history = useHistory();

    // STATES
    const [tags, setTags] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [laneQuantities, setLaneQuantities] = useState({});
    const [laneValues, setLaneValues] = useState({});
    const [file, setFile] = useState({ lanes: [] });

    // === PAGINAÇÃO LOCAL DO KANBAN ===
    const [pagePerLane, setPagePerLane] = useState({});

    // States Modais
    const [laneModalOpen, setLaneModalOpen] = useState(false);
    const [selectedLane, setSelectedLane] = useState(null);
    const [newLanePosition, setNewLanePosition] = useState("");
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [editableTags, setEditableTags] = useState([]);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // KPI STATES
    const [kpiData, setKpiData] = useState({
        activeDealsCount: 0,
        wonDealsCount: 0,
        lostDealsCount: 0,
        wonDealsValue: 0,
        lostDealsValue: 0,
        conversionRate: 0,
        averageTicket: 0,
    });
    const [showValues, setShowValues] = useState(true);

    // MENU / DIALOGS
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dealModalOpen, setDealModalOpen] = useState(false);
    const [dealValue, setDealValue] = useState("");

    // FILTROS
    const [filter, setFilter] = useState({
        search: "",
        visualization: "mine",
        selectedUser: "all",
        laneId: "all",
        period: "all",
        value: "all",
    });

    const [newDealModal, setNewDealModal] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [activeLaneTab, setActiveLaneTab] = useState(0); // Aba ativa no mobile
    const [newDealData, setNewDealData] = useState({
        contactId: null,
        title: "",
        value: "",
        laneId: "",
        notes: "",
    });
    const [contacts, setContacts] = useState([]);

    const fetchTags = async () => {
        try {
            const response = await api.get("/tags/kanban");
            const fetchedTags = response.data.lista || [];
            setTags(fetchedTags);

            const initialPages = {};
            fetchedTags.forEach((tag) => {
                initialPages[tag.id] = 1;
            });
            initialPages["0"] = 1;
            setPagePerLane(initialPages);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchTickets = async () => {
        // --- TRAVA DE SEGURANÇA ANTIG-ERRO 500 ---
        // Se o usuário não tiver filas definidas, ou user não estiver pronto,
        // NÃO chama a API. Isso previne o envio de "[]" ou undefined que quebra o backend.
        if (!user || !user.queues || user.queues.length === 0) {
            return;
        }

        const queueIds = user.queues.map((q) => q.UserQueue.queueId);
        const jsonString = JSON.stringify(queueIds);

        try {
            const { data } = await api.get("/ticket/kanban", {
                params: { queueIds: jsonString, teste: true },
            });
            setTickets(data.tickets);
        } catch (err) {
            console.log(err);
            setTickets([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/users");
            setUsers(data.users);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchContacts = async (search) => {
        try {
            const { data } = await api.get("/contacts", { params: { searchParam: search } });
            setContacts(data.contacts);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        // Só tenta buscar se o user já estiver carregado
        if (user) {
            fetchTags();
            fetchTickets();
            if (user.profile === "admin") fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Dependência user garante que rode quando user carregar

    const handleMenuClick = (event, ticket) => {
        setAnchorEl(event.currentTarget);
        setSelectedTicket(ticket);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleArchive = async () => {
        try {
            await api.put(`/tickets/${selectedTicket.id}`, { status: "closed", userId: user?.id || null });
            toast.success("Ticket arquivado!");
            fetchTickets();
        } catch (err) {
            toast.error("Erro ao arquivar");
        } finally {
            handleMenuClose();
            setOpenDialog(false);
        }
    };
    const handleRefresh = () => {
        fetchTags();
        fetchTickets();
        if (user.profile === "admin") fetchUsers();
        toast.info("Pipeline atualizado");
    };

    // KPI Logic
    useEffect(() => {
        let filtered = tickets.filter((ticket) => {
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                const contactName = ticket.contact?.name?.toLowerCase() || "";
                const contactNumber = ticket.contact?.number || "";
                if (!contactName.includes(searchLower) && !contactNumber.includes(searchLower)) return false;
            }
            if (filter.visualization === "mine") {
                if (ticket.userId !== user.id) return false;
            } else if (filter.visualization === "all" && filter.selectedUser !== "all") {
                if (ticket.userId !== filter.selectedUser) return false;
            }
            if (filter.laneId !== "all") {
                if (filter.laneId === 0 && ticket.tags.length > 0) return false;
                if (filter.laneId !== 0 && !ticket.tags.some((t) => t.id === filter.laneId)) return false;
            }
            if (filter.period !== "all") {
                const ticketDate = new Date(ticket.updatedAt);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (filter.period === "today") {
                    if (ticketDate < today) return false;
                } else if (filter.period === "week") {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    if (ticketDate < startOfWeek) return false;
                } else if (filter.period === "month") {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (ticketDate < startOfMonth) return false;
                } else if (filter.period === "lastMonth") {
                    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    if (ticketDate < startOfLastMonth || ticketDate > endOfLastMonth) return false;
                }
            }
            if (filter.value !== "all") {
                const val = parseFloat(ticket.dealValue) || 0;
                if (filter.value === "low" && val > 1000) return false;
                if (filter.value === "mid" && (val <= 1000 || val > 5000)) return false;
                if (filter.value === "high" && val <= 5000) return false;
            }
            return true;
        });

        setFilteredTickets(filtered);

        let activeCount = 0;
        let wonCount = 0;
        let lostCount = 0;
        let wonValue = 0;
        let lostValue = 0;
        const activeStages = ["proposta enviada", "negociação", "negociacao"];
        const wonStages = ["fechado"];
        const lostStages = ["perdido"];

        filtered.forEach((ticket) => {
            const ticketValue = parseFloat(ticket.dealValue) || 0;
            if (ticket.tags.length === 0) return;
            ticket.tags.forEach((tag) => {
                const tagName = tag.name.toLowerCase();
                if (activeStages.some((stage) => tagName.includes(stage))) activeCount++;
                if (wonStages.some((stage) => tagName.includes(stage))) {
                    wonCount++;
                    wonValue += ticketValue;
                }
                if (lostStages.some((stage) => tagName.includes(stage))) {
                    lostCount++;
                    lostValue += ticketValue;
                }
            });
        });

        const avgTicket = wonCount > 0 ? wonValue / wonCount : 0;
        const totalFinished = wonCount + lostCount;
        const conversionRate = totalFinished > 0 ? (wonCount / totalFinished) * 100 : 0;

        setKpiData({
            activeDealsCount: activeCount,
            wonDealsCount: wonCount,
            lostDealsCount: lostCount,
            wonDealsValue: wonValue,
            lostDealsValue: lostValue,
            conversionRate: conversionRate,
            averageTicket: avgTicket,
        });

        const newQuantities = {};
        const newValues = {};
        const noTag = filtered.filter((t) => t.tags.length === 0);
        newQuantities["0"] = noTag.length;
        newValues["0"] = noTag.reduce((acc, t) => acc + (parseFloat(t.dealValue) || 0), 0);

        tags.forEach((tag) => {
            const count = filtered.filter((t) => t.tags.some((tt) => tt.id === tag.id));
            newQuantities[tag.id] = count.length;
            newValues[tag.id] = count.reduce((acc, t) => acc + (parseFloat(t.dealValue) || 0), 0);
        });
        setLaneQuantities(newQuantities);
        setLaneValues(newValues);
    }, [tickets, filter, tags, user.id]);

    // === MANIPULAÇÃO DE LANE ===
    const handleOpenLaneModal = (tag, currentIndex) => {
        setSelectedLane(tag);
        setNewLanePosition(currentIndex + 1);
        setLaneModalOpen(true);
    };
    const handleSaveLanePosition = async () => {
        const newPos = parseInt(newLanePosition);
        if (isNaN(newPos) || newPos < 1 || newPos > tags.length) {
            toast.error(`Posição inválida.`);
            return;
        }
        const targetIndex = newPos - 1;
        const currentIndex = tags.findIndex((t) => t.id === selectedLane.id);
        if (currentIndex === targetIndex) {
            setLaneModalOpen(false);
            return;
        }
        const newTags = [...tags];
        const [movedTag] = newTags.splice(currentIndex, 1);
        newTags.splice(targetIndex, 0, movedTag);
        setTags(newTags);
        try {
            await api.post("/tags/sync-kanban", { tags: newTags });
            toast.success("Ordem atualizada!");
        } catch (err) {
            toast.error("Erro ao salvar.");
            fetchTags();
        } finally {
            setLaneModalOpen(false);
        }
    };

    // === SETTINGS MODAL ===
    const handleOpenSettingsModal = () => {
        setEditableTags(JSON.parse(JSON.stringify(tags)));
        setSettingsModalOpen(true);
    };
    const handleMoveTagInSettings = (index, direction) => {
        const newTags = [...editableTags];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newTags.length) return;
        const [movedTag] = newTags.splice(index, 1);
        newTags.splice(targetIndex, 0, movedTag);
        setEditableTags(newTags);
    };
    const handleTagChangeInSettings = (index, field, value) => {
        const newTags = [...editableTags];
        newTags[index] = { ...newTags[index], [field]: value };
        setEditableTags(newTags);
    };
    const handleSaveSettings = async () => {
        try {
            await api.post("/tags/sync-kanban", { tags: editableTags });
            for (const tag of editableTags) {
                const original = tags.find((t) => t.id === tag.id);
                if (original && (original.name !== tag.name || original.color !== tag.color)) {
                    await api.put(`/tags/${tag.id}`, { name: tag.name, color: tag.color });
                }
            }
            toast.success("Configurações salvas!");
            setSettingsModalOpen(false);
            fetchTags();
        } catch (err) {
            toast.error("Erro ao salvar configurações");
        }
    };

    // === PAGINAÇÃO "CARREGAR MAIS" ===
    const handleLoadMore = (laneId) => {
        setPagePerLane((prev) => ({
            ...prev,
            [laneId]: (prev[laneId] || 1) + 1,
        }));
    };

    // === MONTAGEM DO BOARD DESKTOP ===
    useEffect(() => {
        if (isMobile) return; // Não monta board no mobile para economizar recurso

        const lanes = [];
        const ITEMS_PER_PAGE = 20;

        tags.forEach((tag, index) => {
            if (filter.laneId === "all" || filter.laneId === tag.id) {
                const CustomLabel = (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <Tooltip title="Clique para alterar a ordem da coluna">
                            <Typography
                                variant="body2"
                                style={{ fontWeight: "bold", cursor: "pointer", color: "#6B7280", fontSize: "15px" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLaneModal(tag, index);
                                }}
                            >
                                {index + 1}
                            </Typography>
                        </Tooltip>
                        <Tooltip title="Como organizar?">
                            <InfoOutlined
                                style={{ fontSize: 16, color: "#9CA3AF", cursor: "pointer" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setInfoModalOpen(true);
                                }}
                            />
                        </Tooltip>
                    </div>
                );

                const allTicketsInLane = filteredTickets.filter((ticket) => ticket.tags.some((t) => t.id === tag.id));
                const currentPage = pagePerLane[tag.id] || 1;
                const visibleTickets = allTicketsInLane.slice(0, currentPage * ITEMS_PER_PAGE);

                const laneCards = visibleTickets.map((ticket) => ({
                    id: ticket.id.toString(),
                    title: <CardTitle ticket={ticket} onEditValue={() => handleEditDealValue(ticket)} />,
                    label: (
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, ticket)}>
                            <MoreVert fontSize="small" style={{ color: "#BDBDBD" }} />
                        </IconButton>
                    ),
                    description: <FooterButtons ticket={ticket} />,
                    draggable: true,
                    href: "/tickets/" + ticket.uuid,
                }));

                if (allTicketsInLane.length > visibleTickets.length) {
                    laneCards.push({
                        id: `load-more-${tag.id}`,
                        title: (
                            <Button onClick={() => handleLoadMore(tag.id)} className={classes.loadMoreBtn} size="small">
                                Carregar mais ({allTicketsInLane.length - visibleTickets.length})
                            </Button>
                        ),
                        draggable: false,
                        label: "",
                        description: "",
                        style: { boxShadow: "none", backgroundColor: "transparent", border: "none", padding: 0 },
                    });
                }

                lanes.push({
                    id: tag.id.toString(),
                    title: (
                        <LaneTitle
                            squareColor={tag.color}
                            quantity={laneQuantities[tag.id.toString()]}
                            totalValue={laneValues[tag.id.toString()]}
                        >
                            {tag.name}
                        </LaneTitle>
                    ),
                    label: CustomLabel,
                    draggable: false,
                    cards: laneCards,
                });
            }
        });
        setFile({ lanes });
    }, [tags, filteredTickets, laneQuantities, laneValues, filter.laneId, pagePerLane, isMobile]);

    const handleCardMove = async (sourceLaneId, targetLaneId, cardId, index) => {
        if (sourceLaneId === targetLaneId) return;
        try {
            await api.delete(`/ticket-tags/${cardId}`);
            if (targetLaneId !== "0") await api.put(`/ticket-tags/${cardId}/${targetLaneId}`);
            toast.success("Movido com sucesso");
            fetchTickets();
            fetchTags();
        } catch (err) {
            console.log(err);
            toast.error("Erro ao mover");
        }
    };

    const handleLaneDragEnd = (removedIndex, addedIndex, payload) => {};
    const handleEditDealValue = (ticket) => {
        setSelectedTicket(ticket);
        setDealValue(currencyMask(parseFloat(ticket.dealValue || 0).toFixed(2)));
        setDealModalOpen(true);
    };
    const handleSaveDealValue = async () => {
        await api.put(`/tickets/${selectedTicket.id}`, {
            dealValue: parseFloat(String(dealValue).replace(/\./g, "").replace(",", ".")),
        });
        fetchTickets();
        setDealModalOpen(false);
        toast.success("Valor salvo!");
    };
    const handleCreateNewDeal = async () => {
        setNewDealModal(false);
        toast.success("Criado com sucesso!");
    };
    const formatBRL = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

    // === CAMPOS DE FILTRO (Reutilizável) ===

    // === RENDERIZAÇÃO MOBILE (NOVO) ===
    const renderMobileBoard = () => {
        if (tags.length === 0) return <Typography align="center">Nenhuma etapa configurada.</Typography>;

        // Etapa atual selecionada
        const currentTag = tags[activeLaneTab];
        if (!currentTag) return null; // Proteção

        const allTicketsInLane = filteredTickets.filter((ticket) => ticket.tags.some((t) => t.id === currentTag.id));
        const currentPage = pagePerLane[currentTag.id] || 1;
        const visibleTickets = allTicketsInLane.slice(0, currentPage * 20);

        return (
            <>
                <Paper className={classes.mobileTabsContainer} elevation={0}>
                    <Tabs
                        value={activeLaneTab}
                        onChange={(e, v) => setActiveLaneTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        {tags.map((tag, idx) => (
                            <Tab
                                key={tag.id}
                                label={
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        {tag.name}
                                        <Badge badgeContent={laneQuantities[tag.id] || 0} color="primary" max={99}>
                                            <div style={{ width: 8 }}></div>
                                        </Badge>
                                    </div>
                                }
                                className={classes.mobileTab}
                            />
                        ))}
                    </Tabs>
                </Paper>

                <LaneTitle
                    squareColor={currentTag.color}
                    quantity={laneQuantities[currentTag.id]}
                    totalValue={laneValues[currentTag.id]}
                >
                    {currentTag.name}
                </LaneTitle>

                <div className={classes.mobileCardList}>
                    {visibleTickets.length > 0 ? (
                        visibleTickets.map((ticket) => (
                            <div key={ticket.id} className={classes.mobileCardItem}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <CardTitle ticket={ticket} onEditValue={() => handleEditDealValue(ticket)} />
                                    <IconButton size="small" onClick={(e) => handleMenuClick(e, ticket)}>
                                        <MoreVert fontSize="small" color="disabled" />
                                    </IconButton>
                                </div>
                                <FooterButtons ticket={ticket} />
                            </div>
                        ))
                    ) : (
                        <Typography variant="body2" align="center" style={{ marginTop: 20, color: "#aaa" }}>
                            Nenhum negócio nesta etapa.
                        </Typography>
                    )}

                    {allTicketsInLane.length > visibleTickets.length && (
                        <Button onClick={() => handleLoadMore(currentTag.id)} className={classes.loadMoreBtn}>
                            Carregar mais ({allTicketsInLane.length - visibleTickets.length})
                        </Button>
                    )}
                </div>
            </>
        );
    };

    // PROTEÇÃO CONTRA ERRO DE CARREGAMENTO
    if (!user || !user.queues) {
        return (
            <div className={classes.loadingContainer}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <div className={classes.headerRow}>
                <Typography className={classes.pageTitle}>Pipeline de Vendas</Typography>
                <div className={classes.headerActions}>
                    <Tooltip title={showValues ? "Ocultar Valores" : "Mostrar Valores"}>
                        <IconButton className={classes.iconBtn} onClick={() => setShowValues(!showValues)}>
                            {showValues ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                    </Tooltip>
                    {!isMobile && (
                        <>
                            <Tooltip title="Customizar Etapas do Funil">
                                <IconButton className={classes.iconBtn} onClick={handleOpenSettingsModal}>
                                    <Settings />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title="Atualizar">
                        <IconButton className={classes.iconBtn} onClick={handleRefresh}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            <KanbanKPIs kpiData={kpiData} showValues={showValues} isMobile={isMobile} />

            {/* BARRA DE AÇÕES (DESKTOP) */}
            {!isMobile && (
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <Button
                        className={classes.newDealBtn}
                        startIcon={<AddIcon />}
                        variant="contained"
                        color="primary"
                        onClick={() => setNewDealModal(true)}
                    >
                        Novo Negócio
                    </Button>
                    <div className={classes.filterContainer}>
                        <KanbanFilters filter={filter} setFilter={setFilter} user={user} users={users} tags={tags} isMobile={isMobile} />
                    </div>
                </div>
            )}

            {/* BOARD */}
            {isMobile ? (
                renderMobileBoard()
            ) : (
                <div className={classes.boardWrapper}>
                    <Board
                        data={file}
                        onCardMoveAcrossLanes={handleCardMove}
                        draggable
                        laneDraggable={false}
                        onLaneDragEnd={handleLaneDragEnd}
                        style={{ backgroundColor: "transparent", height: "100%" }}
                        collapsibleLanes
                        laneStyle={{}}
                        hideCardDeleteIcon
                    />
                </div>
            )}

            {/* FABs MOBILE */}
            {isMobile && (
                <>
                    <Fab
                        color="primary"
                        aria-label="add"
                        className={classes.fabAdd}
                        onClick={() => setNewDealModal(true)}
                    >
                        <AddIcon />
                    </Fab>
                    <Fab
                        size="medium"
                        aria-label="filter"
                        className={classes.fabFilter}
                        onClick={() => setMobileFilterOpen(true)}
                    >
                        <FilterList />
                    </Fab>
                </>
            )}

            {/* DIALOGS ORIGINAIS MANTIDOS */}
            <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => setOpenDialog(true)}>
                    <Archive fontSize="small" style={{ marginRight: 8 }} /> Arquivar (Fechar)
                </MenuItem>
            </Menu>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Arquivar Negócio?</DialogTitle>
                <DialogContent>
                    <Typography>O ticket será fechado e removido do pipeline.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleArchive} color="secondary" variant="contained">
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={dealModalOpen} onClose={() => setDealModalOpen(false)}>
                <DialogTitle>Valor da Oportunidade</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Valor"
                        fullWidth
                        value={dealValue}
                        onChange={(e) => setDealValue(currencyMask(e.target.value))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDealModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveDealValue} color="primary" variant="contained">
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE FILTROS MOBILE */}
            <Dialog open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} fullWidth>
                <DialogTitle>Filtros</DialogTitle>
                <DialogContent dividers className={classes.mobileFilterContent}>
                    <KanbanFilters filter={filter} setFilter={setFilter} user={user} users={users} tags={tags} isMobile={isMobile} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMobileFilterOpen(false)} color="primary">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
            <NewDealModal
                open={newDealModal}
                onClose={() => setNewDealModal(false)}
                isMobile={isMobile}
                classes={classes}
                contacts={contacts}
                fetchContacts={fetchContacts}
                tags={tags}
                newDealData={newDealData}
                setNewDealData={setNewDealData}
                handleCreateNewDeal={handleCreateNewDeal}
            />
            <Dialog open={laneModalOpen} onClose={() => setLaneModalOpen(false)}>
                <DialogTitle>Alterar Ordem da Coluna</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Defina a nova posição numérica para esta coluna (1 = Primeira).
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nova Posição"
                        type="number"
                        fullWidth
                        value={newLanePosition}
                        onChange={(e) => setNewLanePosition(e.target.value)}
                        InputProps={{ inputProps: { min: 1, max: tags.length } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLaneModalOpen(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleSaveLanePosition} color="primary" variant="contained">
                        Salvar e Reordenar
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={infoModalOpen} onClose={() => setInfoModalOpen(false)}>
                <DialogTitle>Organizando as Colunas</DialogTitle>
                <DialogContent>
                    <Typography paragraph>
                        Para manter a ordem do funil sempre correta, utilizamos um sistema numérico:
                    </Typography>
                    <ul>
                        <li>Clique no número no canto direito da coluna para editar.</li>
                        <li>Insira a posição desejada (Ex: 1 para ser a primeira).</li>
                        <li>As outras colunas serão reajustadas automaticamente.</li>
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInfoModalOpen(false)} color="primary">
                        Entendi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* === [NOVO] MODAL DE CONFIGURAÇÕES (ESTILO FIGMA) === */}
            <Dialog
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                maxWidth="sm"
                fullWidth
                scroll="paper"
            >
                <DialogTitle>Customizar Etapas do Funil</DialogTitle>
                <DialogContent dividers className={classes.settingsDialogContent}>
                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
                        Personalize os nomes e cores das etapas do seu pipeline de vendas.
                    </Typography>

                    {editableTags.map((tag, index) => (
                        <div
                            key={tag.id}
                            style={{
                                backgroundColor: theme.palette.background.paper,
                                border: "1px solid #e0e0e080",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "12px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            {/* LINHA 1: NOME + COR */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {/* BOTÕES DE ORDEM (ESQUERDA) */}
                                <div style={{ display: "flex", flexDirection: "column", marginRight: 5 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleMoveTagInSettings(index, -1)}
                                        disabled={index === 0}
                                    >
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleMoveTagInSettings(index, 1)}
                                        disabled={index === editableTags.length - 1}
                                    >
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                </div>

                                {/* INPUT NOME */}
                                <TextField
                                    fullWidth
                                    label={`Nome da Etapa ${index + 1}`}
                                    value={tag.name}
                                    onChange={(e) => handleTagChangeInSettings(index, "name", e.target.value)}
                                    variant="outlined"
                                    size="small"
                                />

                                {/* INPUT COR + HEX */}
                                <div style={{ display: "flex", flexDirection: "column", width: "130px" }}>
                                    <TextField
                                        label="Cor"
                                        value={tag.color}
                                        onChange={(e) => handleTagChangeInSettings(index, "color", e.target.value)}
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <div
                                                        style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #ccc",
                                                            flexShrink: 0,
                                                            backgroundColor: tag.color,
                                                        }}
                                                    ></div>
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end" style={{ marginRight: -10 }}>
                                                    <input
                                                        type="color"
                                                        value={tag.color}
                                                        onChange={(e) =>
                                                            handleTagChangeInSettings(index, "color", e.target.value)
                                                        }
                                                        style={{
                                                            opacity: 0,
                                                            width: "100%",
                                                            height: "100%",
                                                            position: "absolute",
                                                            left: 0,
                                                            top: 0,
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                    <IconButton size="small">
                                                        <Palette fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsModalOpen(false)} color="secondary">
                        CANCELAR
                    </Button>
                    <Button onClick={handleSaveSettings} color="primary" variant="contained" startIcon={<Save />}>
                        SALVAR CUSTOMIZAÇÃO
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Kanban;
