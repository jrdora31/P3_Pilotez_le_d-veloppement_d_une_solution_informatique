import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { FileRecord } from "./files/file-record.entity";
import { FilesModule } from "./files/files.module";
import { ShareLink } from "./files/share-link.entity";
import { User } from "./users/user.entity";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DATABASE_HOST", "localhost"),
        port: Number.parseInt(configService.get<string>("DATABASE_PORT", "5432"), 10),
        username: configService.get<string>("DATABASE_USER", "postgres"),
        password: configService.get<string>("DATABASE_PASSWORD", "postgres"),
        database: configService.get<string>("DATABASE_NAME", "datashare"),
        ssl:
          configService.get<string>("DATABASE_SSL", "false") === "true"
            ? { rejectUnauthorized: false }
            : false,
        entities: [User, FileRecord, ShareLink],
        synchronize: configService.get<string>("TYPEORM_SYNCHRONIZE", "true") === "true"
      })
    }),
    UsersModule,
    AuthModule,
    FilesModule
  ]
})
export class AppModule {}
