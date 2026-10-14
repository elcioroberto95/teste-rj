import { Controller, Get } from "@nestjs/common";
import { RotaPublica } from "./shared/auth/roles.decorator.js";

@Controller("health")
export class HealthController {
  @Get()
  @RotaPublica()
  check() {
    return { status: "ok" };
  }
}
