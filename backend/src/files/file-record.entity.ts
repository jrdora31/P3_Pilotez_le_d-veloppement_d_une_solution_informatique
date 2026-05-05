import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId
} from "typeorm";
import { User } from "../users/user.entity";
import { ShareLink } from "./share-link.entity";

@Entity({ name: "files" })
export class FileRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "owner_id" })
  owner!: User | null;

  @RelationId((file: FileRecord) => file.owner)
  ownerId!: string | null;

  @Column({ name: "original_name" })
  originalName!: string;

  @Column({ name: "storage_name" })
  storageName!: string;

  @Column({ name: "mime_type", default: "application/octet-stream" })
  mimeType!: string;

  @Column({ type: "integer" })
  size!: number;

  @Column({ name: "storage_path" })
  storagePath!: string;

  @Column({ type: "simple-json", nullable: true })
  tags!: string[] | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => ShareLink, (shareLink) => shareLink.file, { cascade: true })
  shareLinks!: ShareLink[];
}
