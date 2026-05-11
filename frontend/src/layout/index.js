import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";
import moment from "moment";
import {
    makeStyles,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    MenuItem,
    IconButton,
    Menu,
    useTheme,
    useMediaQuery,
    Avatar,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AccountCircle from "@material-ui/icons/AccountCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import Tooltip from "@material-ui/core/Tooltip";
import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import UserLanguageSelector from "../components/UserLanguageSelector";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";
import { useDate } from "../hooks/useDate";
import ColorModeContext from "../layout/themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";

const drawerWidth = 260;

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        height: "100vh",
        backgroundColor: theme.palette.fancyBackground,
        overflow: "hidden", // Impede scroll na raiz
    },
    toolbar: {
        paddingRight: 24,
        color: "#FFF",
        background: theme.palette.barraSuperior,
        boxShadow: "none",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        "& .MuiIconButton-root": {
            color: "#FFF !important",
        },
        "& .MuiSvgIcon-root": {
            color: "#FFF !important",
        },
    },
    toolbarIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        minHeight: "64px",
        background: theme.palette.type === "light" ? "#FFFFFF" : "#151b27",
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.05)",
        width: "100%", // Mobile First
    },
    appBarShift: {
        [theme.breakpoints.up("sm")]: {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
    },
    menuButton: {
        marginRight: 20,
        color: "#FFF",
    },
    menuButtonHidden: {
        display: "none",
    },
    title: {
        flexGrow: 1,
        fontSize: 16,
        fontWeight: 600,
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    drawerPaper: {
        position: "relative",
        whiteSpace: "nowrap",
        width: drawerWidth,
        borderRight: "1px solid rgba(0, 0, 0, 0.08)",
        backgroundColor: theme.palette.type === "light" ? "#FFFFFF" : "#151b27",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(9),
        [theme.breakpoints.down("sm")]: {
            width: 0,
            display: "none",
        },
    },
    appBarSpacer: {
        minHeight: "64px",
    },
    content: {
        flex: 1,
        overflow: "auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.default,
        [theme.breakpoints.down("sm")]: {
            padding: 0,
        },
    },
    containerWithScroll: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "auto",
        ...theme.scrollbarStyles,
    },
    logo: {
        width: "70%",
        maxHeight: "45px",
        objectFit: "contain",
        margin: "0 auto",
        transition: "all 0.3s",
    },
    welcomeText: {
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.2,
        color: "#FFF",
    },
    userAvatar: {
        width: 32,
        height: 32,
        fontSize: 14,
        backgroundColor: theme.palette.options,
        color: "#FFF",
    },
}));

const LoggedInLayout = ({ children }) => {
    const classes = useStyles();
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const { handleLogout, loading } = useContext(AuthContext);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerVariant, setDrawerVariant] = useState("permanent");
    const { user } = useContext(AuthContext);

    const theme = useTheme();
    const { colorMode } = useContext(ColorModeContext);
    const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

    const logoLight = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_light.svg`;
    const logoDark = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_dark.svg`;

    const initialLogo = theme.palette.type === "light" ? logoLight : logoDark;
    const [logoImg, setLogoImg] = useState(initialLogo);

    const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
    const { dateToClient } = useDate();

    const socketManager = useContext(SocketContext);

    useEffect(() => {
        if (document.body.offsetWidth > 1200) {
            setDrawerOpen(true);
        }
    }, []);

    useEffect(() => {
        if (document.body.offsetWidth < 1000) {
            setDrawerVariant("temporary");
        } else {
            setDrawerVariant("permanent");
        }
    }, [drawerOpen]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const userId = localStorage.getItem("userId");

        const socket = socketManager.getSocket(companyId);

        socket.on(`company-${companyId}-auth`, (data) => {
            if (data.user.id === +userId) {
                toastError("Sua conta foi acessada em outro computador.");
                setTimeout(() => {
                    localStorage.clear();
                    window.location.reload();
                }, 1000);
            }
        });

        socket.emit("userStatus");
        const interval = setInterval(
            () => {
                socket.emit("userStatus");
            },
            1000 * 60 * 5
        );

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [socketManager]);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
        setMenuOpen(true);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuOpen(false);
    };

    const handleOpenUserModal = () => {
        setUserModalOpen(true);
        handleCloseMenu();
    };

    const drawerClose = () => {
        if (document.body.offsetWidth < 600) {
            setDrawerOpen(false);
        }
    };

    useEffect(() => {
        setLogoImg(theme.palette.type === "light" ? logoLight : logoDark);
    }, [theme.palette.type]);

    const toggleColorMode = () => {
        colorMode.toggleColorMode();
        setLogoImg((prevLogo) => (prevLogo === logoLight ? logoDark : logoLight));
    };

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours >= 6 && hours < 12) return "Bom dia";
        if (hours >= 12 && hours < 18) return "Boa tarde";
        return "Boa noite";
    };

    if (loading) {
        return <BackdropLoading />;
    }

    return (
        <div className={classes.root}>
            <Drawer
                variant={drawerVariant}
                className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
                classes={{
                    paper: clsx(classes.drawerPaper, !drawerOpen && classes.drawerPaperClose),
                }}
                open={drawerOpen}
                onClose={drawerClose}
                ModalProps={{ keepMounted: true }}
            >
                <div className={classes.toolbarIcon}>
                    <img
                        src={`${logoImg}?r=${Math.random()}`}
                        className={classes.logo}
                        style={{ display: drawerOpen ? "block" : "none" }}
                        alt={`${process.env.REACT_APP_NAME_SYSTEM}`}
                    />
                    <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
                        <ChevronLeftIcon />
                    </IconButton>
                </div>
                <Divider />
                <List className={classes.containerWithScroll}>
                    <MainListItems drawerClose={drawerClose} collapsed={!drawerOpen} />
                </List>
                <Divider />
            </Drawer>

            <UserModal open={userModalOpen} onClose={() => setUserModalOpen(false)} userId={user?.id} />

            <AppBar
                position="absolute"
                className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
                color="inherit"
            >
                <Toolbar variant="dense" className={classes.toolbar}>
                    <IconButton
                        edge="start"
                        aria-label="open drawer"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        className={clsx(classes.menuButton, drawerOpen && classes.menuButtonHidden)}
                    >
                        <MenuIcon />
                    </IconButton>

                    <div className={classes.title}>
                        {greaterThenSm && (
                            <div className={classes.welcomeText}>
                                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#FFF" }}>
                                    Olá {user.name}, {getGreeting()}!
                                </Typography>
                                <Typography variant="subtitle2" style={{ opacity: 0.7, color: "#FFF" }}>
                                    {user?.company?.name}
                                    {user?.profile === "admin" &&
                                        user?.company?.dueDate &&
                                        ` (Ativo até ${dateToClient(user?.company?.dueDate)})`}
                                </Typography>
                            </div>
                        )}
                    </div>

                    {/* OCULTA IDIOMA NO MOBILE */}
                    {greaterThenSm && <UserLanguageSelector iconOnly={true} />}

                    <Tooltip title={"Atualizar"}>
                        <IconButton aria-label="refresh" color="inherit" onClick={() => window.location.reload()}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <NotificationsVolume setVolume={setVolume} volume={volume} />

                    {user.id && <NotificationsPopOver volume={volume} />}

                    <AnnouncementsPopover />

                    {/* OCULTA CHAT INTERNO NO MOBILE */}
                    {greaterThenSm && <ChatPopover />}

                    <Tooltip title="Mudar Tema">
                        <IconButton edge="end" color="inherit" onClick={toggleColorMode}>
                            {theme.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>

                    <div style={{ marginLeft: 10 }}>
                        <IconButton
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar className={classes.userAvatar}>
                                {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircle />}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            open={menuOpen}
                            onClose={handleCloseMenu}
                        >
                            <MenuItem onClick={handleOpenUserModal}>
                                <AccountCircle style={{ marginRight: 8, fontSize: 20 }} />{" "}
                                {i18n.t("mainDrawer.appBar.user.profile")}
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ExitToAppIcon style={{ marginRight: 8, fontSize: 20 }} />
                                {i18n.t("Sair")}
                            </MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <main className={classes.content}>
                <div className={classes.appBarSpacer} />
                {children ? children : null}
            </main>
        </div>
    );
};

export default LoggedInLayout;
