import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from 'src/common/exceptions';
import {
  PaginationResponseModel,
  SearchPaginationResponseModel,
} from 'src/common/models';
import * as crypto from 'crypto';

export const formatResponse = <T>(data: T, success: boolean = true) => {
  return {
    success,
    data,
  };
};

export const formatPaginationResult = <T>(
  result: SearchPaginationResponseModel<T>,
  items: any[],
  paginationInfo: PaginationResponseModel,
) => {
  result.pageInfo.pageNum = paginationInfo.pageNum;
  result.pageInfo.pageSize = paginationInfo.pageSize;
  if (paginationInfo.totalItems > 0) {
    result.pageData = items;
    result.pageInfo.totalItems = paginationInfo.totalItems;
    result.pageInfo.totalPages = Math.ceil(
      paginationInfo.totalItems / paginationInfo.pageSize,
    );
  }

  return result;
};

export const isEmptyObject = (obj: any): boolean => {
  return !Object.keys(obj).length;
};

export const validatePaginationInput = (model: any) => {
  if (!model) {
    throw new CustomHttpException(HttpStatus.NOT_FOUND, 'You need to send data');
  }

  if (model.pageInfo.pageNum <= 0 || model.pageInfo.pageSize <= 0) {
    throw new CustomHttpException(
      HttpStatus.BAD_REQUEST,
      'Page num and page size must be equal or greater than 1',
    );
  }
};

export const generateCacheKey = (prefix: string, obj: any) => {
  const hash = crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
  return `${prefix}:${hash}`;
}


export const formatDateTime = (input: Date) => {
  const d = new Date(input);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}