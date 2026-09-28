import { Module } from "@nestjs/common";
import { ComptesStaffController } from "./comptes-staff.controller";
import { ComptesStaffService } from "./comptes-staff.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [ComptesStaffController],
  providers: [ComptesStaffService, EmailService],
})
export class ComptesStaffModule {}
