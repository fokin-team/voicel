<script lang="ts">
import { ref, h, onBeforeMount } from 'vue';

type ModuleType = { default: string };

interface Props {
  name: string;
  size: number,
  fill: string,
}

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: () => 24,
    },
    fill: {
      type: String,
      default: () => '#000000',
    },
  },
  setup(props: Props) {
    const svgElement = ref('');
    const viewBox = ref('0 0 0 0');

    const render = async () => {
      const svgRaw: string = (await import(`./icons/${props.name}.svg?raw`) as ModuleType).default;
      const parser = new DOMParser();
      const svgDocument = parser.parseFromString(svgRaw, 'text/html');
      const svgNode = svgDocument.querySelector('svg');
      if (svgNode) {
        svgElement.value = svgNode.innerHTML;
        // eslint-disable-next-line max-len
        viewBox.value = `${svgNode.viewBox.baseVal.x} ${svgNode.viewBox.baseVal.y} ${svgNode.viewBox.baseVal.width} ${svgNode.viewBox.baseVal.height}`;
      }
    };

    onBeforeMount(async () => {
      await render();
    });

    return () => h('i', {
      style: {
        height: `${props.size}px`,
        width: `${props.size}px`,
      },
    }, [
      h('svg', {
        viewBox: viewBox.value,
        height: `${props.size}px`,
        width: `${props.size}px`,
        innerHTML: svgElement.value,
        fill: props.fill,
      }),
    ]);
  },
};
</script>
