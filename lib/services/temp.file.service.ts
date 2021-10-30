import {BadRequestException, Inject, Injectable} from "@nestjs/common";
import {ConsoleOptions} from "../console.types";

@Injectable()
export class TempFileService {
    @Inject('CONFIG_ROOT_OPTIONS') consoleOptions: ConsoleOptions;
    private files: TempFileModel[] = []

    write(file: FileModel) {
        const exists = this.files.find(x => x.name == file.name);
        if (exists) {
            exists.content = file.content;
            exists.updatedAt = Date.now();
            exists.expiresAt = file.expiresAt;
            if (exists.expiresAt) {
                const timeout = exists.expiresAt - Date.now();
                if (timeout > 0)
                    setTimeout(() => this.deleteExpired(exists.name, exists.expiresAt), exists.expiresAt - Date.now());
                else {
                    console.log('Deleting already expired existing file');
                    this.deleteExpired(exists.name, exists.expiresAt)
                }
            }
        } else {
            const tempFile = file as TempFileModel;
            tempFile.createdAt = Date.now();
            tempFile.updatedAt = Date.now();

            if (tempFile.expiresAt) {
                const timeout = tempFile.expiresAt - Date.now();
                if (timeout > 0) {
                    this.files.push(tempFile);
                    setTimeout(() => this.deleteExpired(tempFile.name, tempFile.expiresAt), tempFile.expiresAt - Date.now());
                } else {
                    console.log('Not adding already expired new file');
                }
            }
            else
                this.files.push(tempFile);
        }
    }

    read(name: string): FileModel {
        const exists = this.files.find(x => x.name == name);
        if (!exists) throw new BadRequestException('File not found');
        return exists;
    }

    delete(name: string) {
        const index = this.files.findIndex(x => x.name == name);
        if (index > -1)
            this.files.splice(index, 1);
    }

    getUrl(name: string){
        return `/${this.consoleOptions['endpoint'] || 'console'}/file/${name}`;
    }

    private deleteExpired(name, expiresAt) {
        const index = this.files.findIndex(x => x.name == name && x.expiresAt == expiresAt);
        if (index > -1)
            this.files.splice(index, 1);
    }
}

export interface FileModel {
    name: string,
    content: any,
    type: 'csv' | 'html',
    expiresAt?: number
}


export interface TempFileModel extends FileModel {
    name: string,
    content: any,
    type: 'csv' | 'html',
    createdAt?: number,
    updatedAt?: number,
}
