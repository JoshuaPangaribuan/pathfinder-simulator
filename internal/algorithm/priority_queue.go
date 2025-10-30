package algorithm

import (
	"container/heap"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

type node struct {
	point    maze.Point
	priority float64
	index    int
}

type priorityQueue []*node

func (pq priorityQueue) Len() int { return len(pq) }

func (pq priorityQueue) Less(i, j int) bool {
	return pq[i].priority < pq[j].priority
}

func (pq priorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].index = i
	pq[j].index = j
}

func (pq *priorityQueue) Push(x any) {
	n := len(*pq)
	item := x.(*node)
	item.index = n
	*pq = append(*pq, item)
}

func (pq *priorityQueue) Pop() any {
	old := *pq
	n := len(old)
	item := old[n-1]
	item.index = -1
	*pq = old[:n-1]
	return item
}

func (pq *priorityQueue) update(item *node, point maze.Point, priority float64) {
	item.point = point
	item.priority = priority
	heap.Fix(pq, item.index)
}

func newPriorityQueue() *priorityQueue {
	pq := &priorityQueue{}
	heap.Init(pq)
	return pq
}
