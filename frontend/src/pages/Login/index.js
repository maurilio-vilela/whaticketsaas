import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        '@media (max-width: 600px)': {
            flexDirection: 'column',
        },
    },
    leftSide: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '@media (max-width: 600px)': {
            flex: "0 0 auto",
            height: '0vh',
            backgroundColor: '#F1F0F0',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
        },
    },
    rightSide: {
        flex: 1,
        backgroundImage: `url(${process.env.REACT_APP_BACKEND_URL}/public/logotipos/background.png)`,
        backgroundColor: "#00BFA510",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '@media (max-width: 600px)': {
            height: '100vh',
        },
    },
    paper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: '#F1F0F0',
        padding: "20px",
        borderRadius: '25px',
        margin: "60.5px 0px",
    },
    form: {
        width: "80%",
        marginTop: theme.spacing(1),
    },
    inputField: {
        margin: theme.spacing(2, 0),
        '& input': {
            padding: "10px 0",
        },
        '& .MuiInput-underline:before': {
            borderBottom: "2px solid #ccc",
        },
        '& .MuiInput-underline:hover:before': {
            borderBottom: "2px solid #000",
        },
        '& .MuiInput-underline:after': {
            borderBottom: "2px solid #2575fc",
        }
    },
    submit: {
        margin: theme.spacing(2, 0, 2),
        borderRadius: '15px',
    },
    link: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        textDecoration: "none",
        '&:hover': {
            textDecoration: "underline",
        }
    },
    logo: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
    },
    logoMobile: {
        height: "10%", // Ocupa a altura do container (15vh)
        width: "12vw",
        maxWidth: "100%",
        objectFit: "contain", // Garante que a logo não distorça
        marginBottom: "10px",
        "@media (max-width: 600px)": {
            height: "10%", // Ocupa a altura do container (15vh)
            width: "40vw",
            maxWidth: "100%",
            objectFit: "contain", // Garante que a logo não distorça
            marginBottom: "10px",
        },
    },
}));

const Login = () => {
    const classes = useStyles();
    const [user, setUser] = useState({ email: "", password: "" });
    const { handleLogin } = useContext(AuthContext);
    const [viewregister, setviewregister] = useState('disabled');
    const [showPassword, setShowPassword] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Novo estado para largura da janela

    const handleClickShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleChangeInput = e => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    // Monitora mudanças no tamanho da janela
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        
        // Cleanup: Remove o listener quando o componente é desmontado
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        fetchviewregister();
    }, []);

    const fetchviewregister = async () => {
        try {
            const responsev = await api.get("/settings/viewregister");
            const viewregisterX = responsev?.data?.value;
            setviewregister(viewregisterX);
        } catch (error) {
            console.error('Error retrieving viewregister', error);
        }
    };

    const handlSubmit = e => {
        e.preventDefault();
        handleLogin(user);
    };

    const logo = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/login.png`;
    const logoMobile = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
    const randomValue = Math.random();
    const logoWithRandom = `${logo}?r=${randomValue}`;
    const logoMobileWithRandom = `${logoMobile}?r=${randomValue}`;

    return (
        <div className={classes.root}>
            <div className={classes.leftSide}>
                <img 
                    className={windowWidth <= 600 ? classes.logoMobile : classes.logo}
                    src={windowWidth <= 600 ? logoMobileWithRandom : logoWithRandom} 
                    alt={`${process.env.REACT_APP_NAME_SYSTEM}`} 
                />
            </div>
            <div className={classes.rightSide}>
                <Container component="main" maxWidth="xs">
                    <CssBaseline/>
                    <div className={classes.paper}>
                        <img
                          className={windowWidth <= 600 ? classes.logoMobile : classes.logoMobile}
                          src={logoMobileWithRandom}
                          alt={`${process.env.REACT_APP_NAME_SYSTEM}`}
                        />
                        
                        <form className={classes.form} noValidate onSubmit={handlSubmit}>
                            <TextField
                                variant="standard"
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label={i18n.t("login.form.email")}
                                name="email"
                                value={user.email}
                                onChange={handleChangeInput}
                                autoComplete="email"
                                autoFocus
                                className={classes.inputField}
                            />
                            <TextField
                                variant="standard"
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label={i18n.t("login.form.password")}
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={user.password}
                                onChange={handleChangeInput}
                                autoComplete="current-password"
                                className={classes.inputField}
                                InputProps={{
                                    endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                    ),
                                }}
                            />
                            
                            <Grid container justify="flex-end">
                                <Grid item xs={6} style={{ textAlign: "right" }}>
                                    <Link component={RouterLink} to="/forgetpsw" variant="body2" className={classes.link}>
                                        Esqueceu sua senha?
                                    </Link>
                                </Grid>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                >
                                    {i18n.t("login.buttons.submit")}
                                </Button>
                            </Grid>
                            
                            {viewregister === "enabled" && (
                                <Grid container direction="column" alignItems="center">
                                    <Grid item>
                                        <Link
                                            href="#"
                                            variant="body2"
                                            component={RouterLink}
                                            to="/signup"
                                            className={classes.link}
                                        >
                                            {i18n.t("login.buttons.register")}
                                        </Link>
                                    </Grid>
                                </Grid>
                            )}
                            
                            <Grid container justifyContent="center">
                                <Grid item>                                  
                                    <Typography variant="body2" color="textSecondary" align="center">
                                        Ao prosseguir, você concorda com nossos 
                                        <Link href="#" variant="body2" component={RouterLink} to="/terms"> Termos de Serviço </Link> 
                                        e  
                                        <Link href="#" variant="body2" component={RouterLink} to="/privacy"> Política de Privacidade</Link>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </form>
                    </div>
                </Container>
            </div>
        </div>
    );
};

export default Login;