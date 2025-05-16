import { Type } from 'class-transformer';
import SearchBlogDto from './search.dto';
import {
  PaginationRequestModel,
  SearchPaginationRequestModel,
} from 'src/common/models';

export default class SearchWithPaginationDto extends SearchPaginationRequestModel<SearchBlogDto> {
  constructor(
    pageInfo: PaginationRequestModel,
    searchCondition: SearchBlogDto,
  ) {
    super(pageInfo, searchCondition);
  }

  // @Type(() => SearchBlogDto)
  // public searchCondition!: SearchBlogDto;
}
