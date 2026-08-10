import { Body, Controller, Post } from "@nestjs/common";
import { AccountRequestsService } from "./account-requests.service";
import { CreateAccountRequestDto } from "./create-account-request.dto";

@Controller("account-requests")
export class AccountRequestsController {
  constructor(private readonly service: AccountRequestsService) {}

  @Post()
  create(@Body() dto: CreateAccountRequestDto) {
    return this.service.create(dto);
  }
}
