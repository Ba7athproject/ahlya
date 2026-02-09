
import os

def list_files(startpath):
    output = []
    for root, dirs, files in os.walk(startpath):
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        output.append('{}{}/'.format(indent, os.path.basename(root)))
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if not f.startswith("."):
                output.append('{}{}'.format(subindent, f))
    return "\n".join(output)

print(list_files('.'))
