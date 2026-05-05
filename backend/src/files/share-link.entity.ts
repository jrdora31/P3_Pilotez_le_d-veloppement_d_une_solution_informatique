import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { FileRecord } from "./file-record.entity";

@Entity({ name: "share_links" })
export class ShareLink {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => FileRecord, (file) => file.shareLinks, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "file_id" })
  file!: FileRecord;

  @Column({ unique: true })
  token!: string;

  @Column({ name: "password_hash", nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
