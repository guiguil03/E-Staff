import { Body, Controller, Post } from "@nestjs/common";
import { RegistrationsService } from "./registrations.service";
import { CreateRegistrationDto } from "./create-registration.dto";

@Controller("registrations")
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }
}
