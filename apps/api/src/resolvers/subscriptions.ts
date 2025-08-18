import { withFilter } from "graphql-subscriptions";

import type { NewJobSubscriptionArgs, PubSubInterface } from "../types/resolvers.js";

export function getSubscriptionResolvers(pubsub: PubSubInterface, NEW_JOB: string): any {
  return {
    newJob: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(NEW_JOB),
        (payload: { newJob: { fitScore: number } }, variables: NewJobSubscriptionArgs) => {
          return payload.newJob.fitScore >= (variables.minFit || 0);
        },
      ),
    },
  };
}
