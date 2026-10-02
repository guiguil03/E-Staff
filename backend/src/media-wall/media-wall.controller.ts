import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { RhGuard } from "../common/rh.guard";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { MediaWallService } from "./media-wall.service";
import { UpdateMediaPostDto } from "./dto/update-media-post.dto";

const MAX_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 Mo
const ALLOWED_MEDIA_MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

// Photos & vidéos de l'équipe (/offres/carrieres) — publiées directement
// par la RH (publication directe, pas de modération).
@ApiTags("Médias")
@Controller()
export class MediaWallController {
  constructor(private readonly service: MediaWallService) {}

  // ---- Vitrine publique ----------------------------------------------------

  @Get("media-posts")
  listPublic() {
    return this.service.listPublic();
  }

  @Get("media-posts/:id/file")
  async streamPublic(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.streamPublic(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // Compteurs publics — pas de compte visiteur, donc pas de vraie
  // déduplication (voir commentaire du modèle MediaPost) : juste un
  // rate-limit par IP pour éviter le spam-clic depuis un même visiteur.
  @UseGuards(RateLimitGuard("media-posts-like", 30))
  @Post("media-posts/:id/like")
  like(@Param("id") id: string) {
    return this.service.like(id);
  }

  @UseGuards(RateLimitGuard("media-posts-unlike", 30))
  @Post("media-posts/:id/unlike")
  unlike(@Param("id") id: string) {
    return this.service.unlike(id);
  }

  @UseGuards(RateLimitGuard("media-posts-share", 30))
  @Post("media-posts/:id/share")
  share(@Param("id") id: string) {
    return this.service.share(id);
  }

  // ---- Portail RH ------------------------------------------------------------

  @UseGuards(RhGuard)
  @Get("rh/media-posts")
  listAdmin() {
    return this.service.listAdmin();
  }

  @UseGuards(RhGuard)
  @Get("rh/media-posts/:id/file")
  async streamAdmin(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.streamAdmin(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @UseGuards(RhGuard)
  @Post("rh/media-posts")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_MEDIA_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MEDIA_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string; auteur?: string; publiee?: string }
  ) {
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (50 Mo max) ou format non supporté (JPG, PNG, WEBP, MP4, WEBM, MOV)."
      );
    }
    return this.service.create(file, body.caption, body.auteur, body.publiee !== "false");
  }

  @UseGuards(RhGuard)
  @Put("rh/media-posts/:id")
  update(@Param("id") id: string, @Body() dto: UpdateMediaPostDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete("rh/media-posts/:id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
