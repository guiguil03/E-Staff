import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountRequestsService } from "./account-requests.service";
import { CreateAccountRequestDto } from "./create-account-request.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";

@ApiTags("Comptes")
@Controller("account-requests")
export class AccountRequestsController {
  constructor(private readonly service: AccountRequestsService) {}

  @UseGuards(RateLimitGuard("account-requests-create", 5))
  @Post()
  create(@Body() dto: CreateAccountRequestDto) {
    return this.service.create(dto);
  }
}
