import * as Yup from "yup";
import { Request, Response } from "express";
import CreateDealService from "../services/DealServices/CreateDealService";
import ListDealsService from "../services/DealServices/ListDealsService";
import UpdateDealService from "../services/DealServices/UpdateDealService";
import DeleteDealService from "../services/DealServices/DeleteDealService";
import ShowDealService from "../services/DealServices/ShowDealService";
import AppError from "../errors/AppError";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, contactId, status } = req.query;
  const { companyId } = req.user;

  const { deals, count, hasMore } = await ListDealsService({
    searchParam: searchParam as string,
    pageNumber: pageNumber as string,
    companyId,
    contactId: contactId ? Number(contactId) : undefined,
    status: status as string
  });

  return res.json({ deals, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  // Adiciona o companyId e o userId (criador) aos dados do corpo
  const dealData = { ...req.body, companyId, userId };

  const schema = Yup.object().shape({
    name: Yup.string().required("O nome da oportunidade é obrigatório"),
    contactId: Yup.number().required("O contato é obrigatório")
  });

  try {
    await schema.validate(dealData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const deal = await CreateDealService(dealData);

  return res.status(200).json(deal);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { dealId } = req.params;
  const { companyId } = req.user;

  const deal = await ShowDealService(Number(dealId), companyId);

  return res.status(200).json(deal);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const dealData = req.body;
  const { dealId } = req.params;

  const deal = await UpdateDealService({
    dealId: Number(dealId),
    companyId,
    dealData
  });

  return res.status(200).json(deal);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { dealId } = req.params;
  const { companyId } = req.user;

  await DeleteDealService(dealId, companyId);

  return res.status(200).json({ message: "Deal deleted" });
};