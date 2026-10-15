import { Controller, Get, Header } from "@nestjs/common";
import { RotaPublica } from "../auth/roles.decorator.js";
import { renderizarMetricas } from "./metrics.js";

@Controller()
export class MetricsController {
  @Get("metrics")
  @RotaPublica()
  @Header("content-type", "text/plain; version=0.0.4; charset=utf-8")
  getMetrics(): string {
    return renderizarMetricas();
  }
}
