/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   online.state.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jdebrull <jdebrull@student.s19.be>         +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/12 10:18:32 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/06/12 11:31:36 by Jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

//set of user ids currently connected via socket.io
export const onlineUsers = new Set<string>();