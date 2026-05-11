import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import AuthUserService from "../services/UserServices/AuthUserService";
// import { SendRefreshToken } from "../helpers/SendRefreshToken"; // REMOVIDO PARA EVITAR ERRO DE DOMÍNIO
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";

// --- FUNÇÃO LOCAL PARA ENVIAR COOKIE CORRETAMENTE ---
const sendRefreshToken = (res: Response, token: string): void => {
  res.cookie("jrt", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    // domain: process.env.COOKIE_DOMAIN, // REMOVIDO: Isso causava o erro no localhost
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Lax permite localhost
    secure: process.env.NODE_ENV === "production", // Secure apenas em produção (HTTPS)
  });
};
// ----------------------------------------------------

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });

  // Usa a função local corrigida
  sendRefreshToken(res, refreshToken);

  const io = getIO();
  io.to(`user-${serializedUser.id}`).emit(`company-${serializedUser.companyId}-auth`, {
    action: "update",
    user: {
      id: serializedUser.id,
      email: serializedUser.email,
      companyId: serializedUser.companyId
    }
  });

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  // Usa a função local corrigida
  sendRefreshToken(res, refreshToken);

  return res.json({ token: newToken, user });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const token: string = req.cookies.jrt;
  
  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
  
  const user = await FindUserFromToken(token);
  const { id, profile, super: superAdmin } = user;

  return res.json({ id, profile, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.user;
  const user = await User.findByPk(id);
  await user.update({ online: false });

  res.clearCookie("jrt");

  return res.send();
};