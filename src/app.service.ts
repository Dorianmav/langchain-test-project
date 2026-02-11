import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return "✅ TEST HOT RELOAD - Modification à 14h43";
  }
}
