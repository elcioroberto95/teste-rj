import { SetMetadata } from "@nestjs/common";
import type { Perfil } from "./auth.types.js";

export const PERFIS_KEY = "perfis";
export const PUBLIC_ROUTE_KEY = "rota_publica";
export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS_KEY, perfis);
export const RotaPublica = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
