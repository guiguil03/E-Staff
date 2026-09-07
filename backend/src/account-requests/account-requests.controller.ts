import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountRequestsService } from "./account-requests.service";
import { CreateAccountRequestDto } from "./create-account-request.dto";

@ApiTags("Comptes")
@Controller("account-requests")
export class AccountRequestsController {
  constructor(private readonly service: AccountRequestsService) {}

  @Post()
  create(@Body() dto: CreateAccountRequestDto) {
    return this.service.create(dto);
  }
}
