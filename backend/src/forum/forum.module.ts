import { Module } from "@nestjs/common";
import { ForumController } from "./forum.controller";
import { ForumService } from "./forum.service";
import { DailyService } from "../classe-virtuelle/daily.service";

@Module({
  controllers: [ForumController],
  providers: [ForumService, DailyService],
})
export class ForumModule {}
