import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { ConfigService } from '@nestjs/config';
// import { UserPackages } from 'src/userPackages/entities/userPackages.entity';

@Injectable()
export class VnpayService {
  private vnpUrl: string;
  private vnpTmnCode: string;
  private vnpHashSecret: string;
  private vnpReturnUrl: string;

  constructor(private configService: ConfigService) {
    this.vnpUrl =
      this.configService.get<string>('VNPAY_URL') ?? 'default_value';
    this.vnpTmnCode =
      this.configService.get<string>('VNPAY_TMN_CODE') ?? 'default_value';
    this.vnpHashSecret =
      this.configService.get<string>('VNPAY_HASH_SECRET') ?? 'default_value';
    this.vnpReturnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ?? 'default_value';
  }

  async createPayment(
    // userPackage: UserPackages,
    id: any,
    param: any,
    amount: any
  ): Promise<string> {
    // if (!userPackage) {
    //   throw new Error('userPackage not found');
    // }

    // const orderId = userPackage.id;
    const createDate = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    //  const amount =  userPackage.package.price * 100;

    // Thông tin gửi đến VNPAY
    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: id,
      vnp_OrderInfo: `Thanh toan cho ma GD: ${id}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount.toString(),
      vnp_ReturnUrl: `${this.vnpReturnUrl}${param}`,
      vnp_IpAddr: "14.225.217.181",
      vnp_CreateDate: createDate,
    };

    // Sắp xếp theo thứ tự a-z trước khi ký
    const sortedParams = this.sortObject(vnpParams);

    // console.log('Sign data:', signData);
    let signData = qs.stringify(sortedParams, { encode: false });

    // Tạo chữ ký
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const secureHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Thêm chữ ký vào params
    sortedParams['vnp_SecureHash'] = secureHash;


    const paymentUrl = this.vnpUrl + '?' + qs.stringify(sortedParams, { encode: false });
    return paymentUrl;
  }

  private sortObject(obj: Record<string, any>) {
    let sorted: Record<string, string> = {}; // 👈 Khai báo kiểu dữ liệu rõ ràng
    let str: string[] = []; // 👈 Đảm bảo str là mảng string

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();

    for (let i = 0; i < str.length; i++) {
      let sortedKey = str[i];
      sorted[sortedKey] = encodeURIComponent(obj[sortedKey]).replace(/%20/g, "+");
    }

    return sorted; // 👈 Fix lỗi cú pháp (retur -> return)
  }



}
