/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* api.types.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

export interface ApiError {
  error: string;
  code: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
