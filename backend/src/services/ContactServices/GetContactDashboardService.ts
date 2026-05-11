import { QueryTypes } from "sequelize";
import sequelize from "../../database";

interface DashboardData {
  countTotal: number;
  countToday: number;
  countWeek: number;
  countMonth: number;
}

const GetContactDashboardService = async (companyId: number): Promise<DashboardData> => {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM "Contacts" WHERE "companyId" = :companyId) as "countTotal",
      (SELECT COUNT(*) FROM "Contacts" WHERE "companyId" = :companyId AND "createdAt" >= CURRENT_DATE) as "countToday",
      (SELECT COUNT(*) FROM "Contacts" WHERE "companyId" = :companyId AND "createdAt" >= (CURRENT_DATE - INTERVAL '7 days')) as "countWeek",
      (SELECT COUNT(*) FROM "Contacts" WHERE "companyId" = :companyId AND "createdAt" >= date_trunc('month', CURRENT_DATE)) as "countMonth";
  `;

  const replacements = { companyId };

  const [result] = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT
  });

  const data: any = result;

  // Forçamos a conversão para Number/Integer para garantir que o React não receba strings
  return {
    countTotal: Number(data?.countTotal || 0),
    countToday: Number(data?.countToday || 0),
    countWeek: Number(data?.countWeek || 0),
    countMonth: Number(data?.countMonth || 0)
  };
};

export default GetContactDashboardService;